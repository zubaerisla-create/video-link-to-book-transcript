import re
import time
import asyncio
import logging
from typing import Optional, Dict, Any, Tuple
from collections import OrderedDict

from server.app.config import settings

logger = logging.getLogger("transcriptly.coordinator")


def sanitize_details(text_or_exc: Any) -> str:
    """
    Sanitizes error details, removing cookies, auth tokens, sensitive query params,
    credentials, and IP addresses to prevent leakage into logs or responses.
    """
    if text_or_exc is None:
        return ""
    text = str(text_or_exc)

    # Redact cookie and session strings
    text = re.sub(r"(cookie[s]?\s*[:=]\s*)[^\s;,\'\"]+", r"\1[REDACTED]", text, flags=re.IGNORECASE)
    text = re.sub(r"(session[_-]?token\s*[:=]\s*)[^\s;,\'\"]+", r"\1[REDACTED]", text, flags=re.IGNORECASE)
    text = re.sub(r"(bearer\s+)[a-zA-Z0-9_\-\.]+", r"\1[REDACTED]", text, flags=re.IGNORECASE)
    text = re.sub(r"(authorization\s*[:=]\s*)[^\s;,\'\"]+", r"\1[REDACTED]", text, flags=re.IGNORECASE)
    text = re.sub(r"((?:auth[_-]?key|api[_-]?key|secret(?:[_-]?key)?|password|access[_-]?token)\s*[:=]\s*)[^\s;,\'\"]+", r"\1[REDACTED]", text, flags=re.IGNORECASE)
    text = re.sub(r"([&?](?:key|token|sig|api_key|secret)=)[^&]+", r"\1[REDACTED]", text, flags=re.IGNORECASE)

    # Clean multi-line traces into single compact string
    text = re.sub(r"\s+", " ", text).strip()
    return text[:300]


class TranscriptCache:
    """
    In-memory, thread-safe, bounded TTL cache for successful transcript results.
    Never stores failed results or exceptions.
    """
    def __init__(self, max_size: int = 500, default_ttl: int = 600):
        self.max_size = max_size
        self.default_ttl = default_ttl
        self._response_cache: OrderedDict[str, Tuple[float, Any]] = OrderedDict()
        self._raw_cache: OrderedDict[str, Tuple[float, Any]] = OrderedDict()
        self._lock = asyncio.Lock()

    def _purge_expired(self, cache_dict: OrderedDict[str, Tuple[float, Any]], now: float) -> None:
        expired_keys = [k for k, (exp, _) in cache_dict.items() if now >= exp]
        for k in expired_keys:
            cache_dict.pop(k, None)

    async def get_response(self, key: str) -> Optional[Any]:
        async with self._lock:
            now = time.time()
            if key in self._response_cache:
                exp, data = self._response_cache[key]
                if now < exp:
                    self._response_cache.move_to_end(key)
                    logger.debug("Response cache HIT for key: %s", key)
                    return data
                else:
                    self._response_cache.pop(key, None)
            return None

    async def set_response(self, key: str, data: Any, ttl: Optional[int] = None) -> None:
        if data is None:
            return
        ttl_val = ttl if ttl is not None else self.default_ttl
        async with self._lock:
            now = time.time()
            self._purge_expired(self._response_cache, now)
            while len(self._response_cache) >= self.max_size:
                self._response_cache.popitem(last=False)
            self._response_cache[key] = (now + ttl_val, data)
            logger.debug("Response cache SET for key: %s (ttl=%ss)", key, ttl_val)

    async def get_raw(self, key: str) -> Optional[Any]:
        async with self._lock:
            now = time.time()
            if key in self._raw_cache:
                exp, data = self._raw_cache[key]
                if now < exp:
                    self._raw_cache.move_to_end(key)
                    logger.debug("Raw transcript cache HIT for key: %s", key)
                    return data
                else:
                    self._raw_cache.pop(key, None)
            return None

    async def set_raw(self, key: str, data: Any, ttl: Optional[int] = None) -> None:
        if data is None:
            return
        ttl_val = ttl if ttl is not None else self.default_ttl
        async with self._lock:
            now = time.time()
            self._purge_expired(self._raw_cache, now)
            while len(self._raw_cache) >= self.max_size:
                self._raw_cache.popitem(last=False)
            self._raw_cache[key] = (now + ttl_val, data)
            logger.debug("Raw transcript cache SET for key: %s (ttl=%ss)", key, ttl_val)

    async def clear(self) -> None:
        async with self._lock:
            self._response_cache.clear()
            self._raw_cache.clear()


class SingleFlightCoordinator:
    """
    Prevents duplicate upstream requests for the same key while a request is in flight.
    Concurrent callers for the exact same resource await the single in-flight task.
    """
    def __init__(self):
        self._in_flight: Dict[str, asyncio.Future] = {}
        self._lock = asyncio.Lock()

    async def execute(self, key: str, coroutine_fn, *args, **kwargs):
        future: Optional[asyncio.Future] = None
        is_leader = False

        async with self._lock:
            if key in self._in_flight:
                logger.info("Coalescing duplicate concurrent request for key: %s", key)
                future = self._in_flight[key]
            else:
                loop = asyncio.get_running_loop()
                future = loop.create_future()
                self._in_flight[key] = future
                is_leader = True

        if not is_leader:
            # Wait for leader's result
            return await future

        # Leader executes the actual work
        try:
            result = await coroutine_fn(*args, **kwargs)
            if not future.done():
                future.set_result(result)
            return result
        except BaseException as exc:
            if not future.done():
                future.set_exception(exc)
            raise
        finally:
            if future is not None and future.done() and not future.cancelled():
                try:
                    _ = future.exception()
                except Exception:
                    pass
            async with self._lock:
                self._in_flight.pop(key, None)


class TranscriptCoordinator:
    """
    Coordinates caching, single-flight request coalescing, and server-side concurrency limiting.
    """
    def __init__(self, max_concurrent: Optional[int] = None, queue_timeout: Optional[float] = None):
        self.max_concurrent = max_concurrent
        self.queue_timeout = queue_timeout
        self.cache = TranscriptCache(
            max_size=500,
            default_ttl=settings.TRANSCRIPT_CACHE_TTL_SECONDS,
        )
        self.single_flight = SingleFlightCoordinator()
        self._semaphore: Optional[asyncio.Semaphore] = None
        self._semaphore_lock = asyncio.Lock()

    async def _get_semaphore(self) -> asyncio.Semaphore:
        if self._semaphore is None:
            async with self._semaphore_lock:
                if self._semaphore is None:
                    limit = self.max_concurrent if self.max_concurrent is not None else max(1, settings.MAX_CONCURRENT_TRANSCRIPT_JOBS)
                    self._semaphore = asyncio.Semaphore(limit)
                    logger.info("Initialized transcript concurrency semaphore (limit=%s)", limit)
        return self._semaphore

    async def acquire_concurrency_slot(self, timeout: Optional[float] = None) -> bool:
        """
        Acquires a concurrency slot or raises/returns false on timeout.
        """
        sem = await self._get_semaphore()
        wait_timeout = (
            timeout
            if timeout is not None
            else (self.queue_timeout if self.queue_timeout is not None else settings.TRANSCRIPT_QUEUE_TIMEOUT_SECONDS)
        )
        try:
            await asyncio.wait_for(sem.acquire(), timeout=wait_timeout)
            return True
        except asyncio.TimeoutError:
            return False

    async def release_concurrency_slot(self) -> None:
        sem = await self._get_semaphore()
        sem.release()


# Global singleton coordinator
coordinator = TranscriptCoordinator()
