import time
import logging
from collections import defaultdict
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from server.app.config import settings
from server.app.db.database import init_db
from server.app.db.migrations import run_database_migrations
from server.app.api.routes import router as transcript_router
from server.app.api.auth import router as auth_router
from server.app.api.books import router as books_router
from server.app.api.analytics import router as analytics_router
from server.app.api.admin import router as admin_router
from server.app.api.dictionary import router as dictionary_router
from server.app.api.contact import router as contact_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("transcriptly")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and apply safe migrations on application startup
    try:
        logger.info("Initializing database schema...")
        init_db()
        run_database_migrations()
        logger.info("Database schema initialized and verified successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}", exc_info=True)
    yield


TRUSTED_PROXIES = {"127.0.0.1", "::1", "localhost", "testclient"}


def extract_client_ip(request: Request) -> str:
    peer_ip = request.client.host if request.client else "127.0.0.1"
    # Only trust forwarded headers when the immediate connection originates from our local reverse proxy
    if peer_ip in TRUSTED_PROXIES:
        real_ip = request.headers.get("x-real-ip")
        if real_ip and real_ip.strip():
            return real_ip.strip()
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            hops = [ip.strip() for ip in forwarded.split(",") if ip.strip()]
            if hops:
                # Take the rightmost hop appended by our reverse proxy to prevent client spoofing
                return hops[-1]
    return peer_ip


# In-memory rate limiter per IP with strict limits on auth and bounded key storage
class RateLimitMiddleware(BaseHTTPMiddleware):
    instance = None
    MAX_TRACKED_IPS = 10_000

    def __init__(
        self,
        app,
        max_requests: int = 60,
        auth_max_requests: int = 15,
        window_seconds: int = 60,
    ):
        super().__init__(app)
        self.max_requests = max_requests
        self.auth_max_requests = auth_max_requests
        self.window_seconds = window_seconds
        self.ip_records = defaultdict(list)
        self.auth_ip_records = defaultdict(list)
        RateLimitMiddleware.instance = self

    def _prune_records(self, records: dict, now: float) -> None:
        expired_keys = []
        for ip, times in list(records.items()):
            recent = [t for t in times if now - t < self.window_seconds]
            if recent:
                records[ip] = recent
            else:
                expired_keys.append(ip)
        for ip in expired_keys:
            records.pop(ip, None)
        if len(records) >= self.MAX_TRACKED_IPS:
            # Evict the least recently active IP if still at capacity
            oldest_ip = min(records, key=lambda k: records[k][-1] if records[k] else 0.0)
            records.pop(oldest_ip, None)

    async def dispatch(self, request: Request, call_next):
        # Allow health check without rate limit
        path = request.url.path
        if path == "/api/health":
            return await call_next(request)

        client_ip = extract_client_ip(request)
        now = time.time()

        # Stricter rate limit on auth endpoints (brute force mitigation)
        if path in (
            "/api/auth/login",
            "/api/auth/signup",
            "/api/auth/forgot-password",
            "/api/auth/reset-password",
        ):
            if client_ip not in self.auth_ip_records and len(self.auth_ip_records) >= self.MAX_TRACKED_IPS:
                self._prune_records(self.auth_ip_records, now)

            auth_timestamps = [
                t for t in self.auth_ip_records.get(client_ip, []) if now - t < self.window_seconds
            ]
            if len(auth_timestamps) >= self.auth_max_requests:
                self.auth_ip_records[client_ip] = auth_timestamps
                oldest = auth_timestamps[0]
                retry_after = max(1, int(self.window_seconds - (now - oldest)))
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    headers={"Retry-After": str(retry_after)},
                    content={
                        "detail": f"Too many authentication attempts. Please slow down and try again in {retry_after} seconds.",
                        "code": "AUTH_RATE_LIMIT_EXCEEDED",
                        "retry_after": retry_after,
                    },
                )
            auth_timestamps.append(now)
            self.auth_ip_records[client_ip] = auth_timestamps

        # General rate limiting
        if client_ip not in self.ip_records and len(self.ip_records) >= self.MAX_TRACKED_IPS:
            self._prune_records(self.ip_records, now)

        timestamps = self.ip_records.get(client_ip, [])
        valid_timestamps = [t for t in timestamps if now - t < self.window_seconds]
        if len(valid_timestamps) >= self.max_requests:
            self.ip_records[client_ip] = valid_timestamps
            oldest = valid_timestamps[0]
            retry_after = max(1, int(self.window_seconds - (now - oldest)))
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                headers={"Retry-After": str(retry_after)},
                content={
                    "detail": f"Too many requests. Please slow down and try again in {retry_after} seconds.",
                    "code": "RATE_LIMIT_EXCEEDED",
                    "retry_after": retry_after,
                },
            )

        valid_timestamps.append(now)
        self.ip_records[client_ip] = valid_timestamps
        response = await call_next(request)
        return response


def reset_rate_limiter():
    """Resets in-memory rate limit counters for testing."""
    if RateLimitMiddleware.instance:
        RateLimitMiddleware.instance.ip_records.clear()
        RateLimitMiddleware.instance.auth_ip_records.clear()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Clean, reliable YouTube transcript extraction API with user library and digital book reader.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^chrome-extension://.*$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate Limiter Middleware
app.add_middleware(
    RateLimitMiddleware,
    max_requests=settings.RATE_LIMIT_PER_MINUTE,
    auth_max_requests=settings.AUTH_RATE_LIMIT_PER_MINUTE,
    window_seconds=60,
)


# Global unhandled exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing request to {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An unexpected server error occurred. Please try again later.",
            "code": "INTERNAL_SERVER_ERROR",
        },
    )


# Include API routes
app.include_router(transcript_router)
app.include_router(auth_router, prefix="/api")
app.include_router(books_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(dictionary_router, prefix="/api")
app.include_router(contact_router, prefix="/api")
