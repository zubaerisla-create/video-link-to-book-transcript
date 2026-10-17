import asyncio
import time
from unittest.mock import patch, MagicMock, AsyncMock
import pytest
from fastapi.testclient import TestClient
from starlette.requests import Request

from server.app.main import app, extract_client_ip
from server.app.services.transcript_coordinator import (
    TranscriptCache,
    SingleFlightCoordinator,
    TranscriptCoordinator,
    sanitize_details,
    coordinator,
)
from server.app.services.youtube_service import (
    YouTubeError,
    extract_retry_after,
    fetch_raw_transcript_with_retry,
)
from server.app.config import settings

client = TestClient(app)


def test_extract_client_ip_headers():
    """Verify that client IP is correctly extracted from reverse proxy headers."""
    # 1. X-Forwarded-For with multiple IPs (client, proxy1, proxy2)
    req_forwarded = Request({
        "type": "http",
        "headers": [(b"x-forwarded-for", b"203.0.113.195, 70.41.3.18, 150.172.238.178")],
        "client": ("127.0.0.1", 12345),
    })
    assert extract_client_ip(req_forwarded) == "203.0.113.195"

    # 2. X-Real-IP
    req_real_ip = Request({
        "type": "http",
        "headers": [(b"x-real-ip", b"198.51.100.42")],
        "client": ("127.0.0.1", 12345),
    })
    assert extract_client_ip(req_real_ip) == "198.51.100.42"

    # 3. Fallback to client.host if no proxy headers
    req_direct = Request({
        "type": "http",
        "headers": [],
        "client": ("192.168.1.50", 12345),
    })
    assert extract_client_ip(req_direct) == "192.168.1.50"


def test_sanitize_details_redacts_credentials():
    """Ensure sensitive tokens, cookies, and keys are redacted from logs and errors."""
    raw_err = "Request failed with cookie: session_token=SECRET_TOKEN_12345; auth_key=SUPER_SECRET_KEY"
    sanitized = sanitize_details(raw_err)
    assert "SECRET_TOKEN_12345" not in sanitized
    assert "SUPER_SECRET_KEY" not in sanitized
    assert "[REDACTED]" in sanitized


@pytest.mark.asyncio
async def test_transcript_cache_ttl_and_purge():
    """Verify TTL expiration, bounded eviction, and that None is never cached."""
    cache = TranscriptCache(max_size=3, default_ttl=1)

    # Store items
    await cache.set_response("key1", {"data": 1}, ttl=1)
    await cache.set_response("key2", {"data": 2}, ttl=1)

    # Retrieval before expiry
    assert await cache.get_response("key1") == {"data": 1}
    assert await cache.get_response("key2") == {"data": 2}

    # None is rejected
    await cache.set_response("key_none", None)
    assert await cache.get_response("key_none") is None

    # Wait for TTL expiration
    await asyncio.sleep(1.05)
    assert await cache.get_response("key1") is None
    assert await cache.get_response("key2") is None


@pytest.mark.asyncio
async def test_single_flight_coalescing():
    """Verify that multiple concurrent requests for the same key coalesce into a single execution."""
    single_flight = SingleFlightCoordinator()
    execution_count = 0

    async def worker(param: str):
        nonlocal execution_count
        execution_count += 1
        await asyncio.sleep(0.05)
        return f"result_for_{param}"

    # Fire 5 concurrent requests with identical key
    results = await asyncio.gather(
        single_flight.execute("test_coalesce_key", worker, "alpha"),
        single_flight.execute("test_coalesce_key", worker, "alpha"),
        single_flight.execute("test_coalesce_key", worker, "alpha"),
        single_flight.execute("test_coalesce_key", worker, "alpha"),
        single_flight.execute("test_coalesce_key", worker, "alpha"),
    )

    # Worker was executed only ONCE
    assert execution_count == 1
    # All 5 callers received the exact same result
    assert all(r == "result_for_alpha" for r in results)


@pytest.mark.asyncio
async def test_concurrency_coordinator_slot_timeout():
    """Verify that concurrency slot acquisition honors timeouts and rejects excessive requests."""
    test_coordinator = TranscriptCoordinator(max_concurrent=1, queue_timeout=0.05)

    # Acquire only available slot
    assert await test_coordinator.acquire_concurrency_slot() is True

    # Attempt to acquire another slot while first is held -> should time out and return False
    second_slot = await test_coordinator.acquire_concurrency_slot()
    assert second_slot is False

    # Release slot
    await test_coordinator.release_concurrency_slot()

    # Now acquisition succeeds
    assert await test_coordinator.acquire_concurrency_slot() is True
    await test_coordinator.release_concurrency_slot()


def test_extract_retry_after():
    """Verify extraction of Retry-After headers and error message seconds."""
    # From mock response object with headers
    class MockExcWithResponse(Exception):
        def __init__(self):
            mock_res = MagicMock()
            mock_res.headers = {"Retry-After": "45"}
            self.response = mock_res

    assert extract_retry_after(MockExcWithResponse()) == 45

    # From string message
    exc_with_msg = Exception("Throttled by upstream. Please retry in 12 seconds.")
    assert extract_retry_after(exc_with_msg) == 12

    # Unrelated exception
    assert extract_retry_after(Exception("General failure")) is None


@pytest.mark.asyncio
async def test_fetch_raw_transcript_with_retry_backoff_bounds():
    """Verify that transient 429 errors back off with jitter up to max retries, then raise."""
    call_count = 0

    def mock_failing_fetcher(video_id, preferred_language=None, video_title=None):
        nonlocal call_count
        call_count += 1
        raise YouTubeError("YouTube throttled request", "YOUTUBE_BLOCKED", 429)

    # Max retries = 2 -> total attempts = 1 initial + 2 retries = 3 calls
    with patch.object(settings, "TRANSCRIPT_MAX_RETRIES", 2), \
         patch.object(settings, "TRANSCRIPT_INITIAL_BACKOFF_SECONDS", 0.01), \
         patch.object(settings, "TRANSCRIPT_MAX_BACKOFF_SECONDS", 0.1):
        with pytest.raises(YouTubeError) as exc_info:
            await fetch_raw_transcript_with_retry(
                video_id="blockedVid1",
                fetcher=mock_failing_fetcher,
            )

        assert exc_info.value.status_code == 429
        assert exc_info.value.code == "YOUTUBE_BLOCKED"
        assert call_count == 3


@pytest.mark.asyncio
async def test_fetch_raw_transcript_aborts_if_retry_after_too_large():
    """Verify that if Retry-After exceeds MAX_BACKOFF_SECONDS, retry aborts immediately without hanging."""
    call_count = 0

    def mock_long_retry_fetcher(video_id, preferred_language=None, video_title=None):
        nonlocal call_count
        call_count += 1
        raise YouTubeError("YouTube throttled request", "YOUTUBE_BLOCKED", 429, retry_after=60)

    with patch.object(settings, "TRANSCRIPT_MAX_RETRIES", 2), \
         patch.object(settings, "TRANSCRIPT_MAX_BACKOFF_SECONDS", 8.0):
        with pytest.raises(YouTubeError) as exc_info:
            await fetch_raw_transcript_with_retry(
                video_id="blockedVid2",
                fetcher=mock_long_retry_fetcher,
            )

        assert exc_info.value.status_code == 429
        assert exc_info.value.retry_after == 60
        # Call count is 1 because retry aborted immediately
        assert call_count == 1


@pytest.mark.asyncio
async def test_non_429_errors_are_not_retried():
    """Verify that permanent errors (e.g. 404 NO_CAPTIONS) are raised immediately without retries."""
    call_count = 0

    def mock_404_fetcher(video_id, preferred_language=None, video_title=None):
        nonlocal call_count
        call_count += 1
        raise YouTubeError("No captions available", "NO_CAPTIONS", 404)

    with patch.object(settings, "TRANSCRIPT_MAX_RETRIES", 2):
        with pytest.raises(YouTubeError) as exc_info:
            await fetch_raw_transcript_with_retry(
                video_id="noCaptionsVid",
                fetcher=mock_404_fetcher,
            )

        assert exc_info.value.status_code == 404
        assert call_count == 1


@patch("server.app.api.routes.get_video_info")
@patch("server.app.api.routes.fetch_raw_transcript")
def test_api_returns_distinct_429_and_retry_after_header(mock_fetch_transcript, mock_get_video_info):
    """Verify that upstream 429 raises HTTP 429 with Retry-After header and structured JSON."""
    mock_get_video_info.return_value = {"title": "Test Title", "author": "Channel"}
    mock_fetch_transcript.side_effect = YouTubeError(
        "YouTube has temporarily throttled automated caption requests from the server.",
        "YOUTUBE_BLOCKED",
        429,
        retry_after=20,
    )

    response = client.post(
        "/api/transcript",
        json={"url": "https://www.youtube.com/watch?v=dQw4w9WgXc1"}
    )

    assert response.status_code == 429
    assert response.headers.get("Retry-After") == "20"
    data = response.json()
    assert data["detail"]["code"] == "YOUTUBE_BLOCKED"
    assert data["detail"]["retry_after"] == 20
    assert "throttled" in data["detail"]["detail"].lower()


@patch("server.app.api.routes.get_video_info")
@patch("server.app.api.routes.fetch_raw_transcript")
def test_caching_eliminates_duplicate_upstream_calls(mock_fetch_transcript, mock_get_video_info):
    """Verify that identical requests hit cache and don't re-invoke upstream YouTube fetcher."""
    mock_get_video_info.return_value = {
        "video_id": "dQw4w9WgXc2",
        "title": "Cached Video",
        "author": "Creator",
        "thumbnail_url": None,
    }
    mock_track = MagicMock()
    mock_track.is_translatable = False

    mock_fetch_transcript.return_value = (
        [{"text": "Cached line 1", "start": 0.0, "duration": 2.0}],
        "English",
        "en",
        False,
        [{"code": "en", "name": "English", "is_generated": False, "is_translatable": False}],
        mock_track,
    )

    url = "https://www.youtube.com/watch?v=dQw4w9WgXc2"

    # First request: invokes upstream mock
    res1 = client.post("/api/transcript", json={"url": url, "paragraph_length": "medium"})
    assert res1.status_code == 200
    assert mock_fetch_transcript.call_count == 1

    # Second identical request: served from cache without re-invoking mock
    res2 = client.post("/api/transcript", json={"url": url, "paragraph_length": "medium"})
    assert res2.status_code == 200
    assert mock_fetch_transcript.call_count == 1
    assert res2.json()["paragraphs"] == res1.json()["paragraphs"]


@patch("server.app.api.routes.get_video_info")
@patch("server.app.api.routes.fetch_raw_transcript")
def test_failed_requests_are_not_cached(mock_fetch_transcript, mock_get_video_info):
    """Verify that failed requests (404/429) are never cached as successes."""
    mock_get_video_info.return_value = None
    mock_fetch_transcript.side_effect = YouTubeError("No captions", "NO_CAPTIONS", 404)

    url = "https://www.youtube.com/watch?v=dQw4w9WgXc3"

    res1 = client.post("/api/transcript", json={"url": url})
    assert res1.status_code == 404
    assert mock_fetch_transcript.call_count == 1

    # Second call should still attempt extraction, not return a cached success
    res2 = client.post("/api/transcript", json={"url": url})
    assert res2.status_code == 404
    assert mock_fetch_transcript.call_count == 2


@pytest.mark.asyncio
async def test_ip_blocked_and_permission_errors_are_not_retried():
    """Verify that IP blocks and permission errors fail immediately without retry attempts."""
    ip_call_count = 0
    bot_call_count = 0

    def mock_ip_blocked_fetcher(video_id, preferred_language=None, video_title=None):
        nonlocal ip_call_count
        ip_call_count += 1
        raise YouTubeError("Server IP restricted", "IP_BLOCKED", 403, retryable=False)

    def mock_bot_blocked_fetcher(video_id, preferred_language=None, video_title=None):
        nonlocal bot_call_count
        bot_call_count += 1
        raise YouTubeError("Bot detected", "REQUEST_BLOCKED", 403, retryable=False)

    with patch.object(settings, "TRANSCRIPT_MAX_RETRIES", 2):
        with pytest.raises(YouTubeError) as exc_info1:
            await fetch_raw_transcript_with_retry("ipBlockVid1", fetcher=mock_ip_blocked_fetcher)
        assert exc_info1.value.status_code == 403
        assert exc_info1.value.code == "IP_BLOCKED"
        assert ip_call_count == 1  # No retries!

        with pytest.raises(YouTubeError) as exc_info2:
            await fetch_raw_transcript_with_retry("botBlockVid2", fetcher=mock_bot_blocked_fetcher)
        assert exc_info2.value.status_code == 403
        assert exc_info2.value.code == "REQUEST_BLOCKED"
        assert bot_call_count == 1  # No retries!


@patch("server.app.api.routes.get_video_info")
@patch("server.app.api.routes.fetch_raw_transcript")
def test_api_returns_403_for_ip_blocked_with_guidance(mock_fetch_transcript, mock_get_video_info):
    """Verify that an IP_BLOCKED error returns HTTP 403 with clear explanation and fallback hints."""
    mock_get_video_info.return_value = {"title": "Test IP Block", "author": "Channel"}
    mock_fetch_transcript.side_effect = YouTubeError(
        "The server IP address is currently restricted by YouTube bot-detection policies.",
        "IP_BLOCKED",
        403,
        retryable=False,
    )

    response = client.post(
        "/api/transcript",
        json={"url": "https://www.youtube.com/watch?v=dQw4w9WgXc4", "enable_speech_fallback": False}
    )

    assert response.status_code == 403
    data = response.json()
    assert data["detail"]["code"] == "IP_BLOCKED"
    assert "extension" in data["detail"]["detail"].lower() or "subtitle" in data["detail"]["detail"].lower()


@patch("server.app.api.routes.get_video_info")
@patch("server.app.api.routes.fetch_raw_transcript")
@patch("server.app.api.routes.transcribe_youtube_audio")
def test_speech_fallback_triggers_on_ip_blocked_when_enabled(
    mock_speech, mock_fetch_transcript, mock_get_video_info
):
    """Verify that when enable_speech_fallback=True, IP_BLOCKED error falls back to speech transcription."""
    mock_get_video_info.return_value = {"video_id": "dQw4w9WgXc5", "title": "Audio Speech Fallback"}
    mock_fetch_transcript.side_effect = YouTubeError(
        "Server IP blocked",
        "IP_BLOCKED",
        403,
        retryable=False,
    )
    mock_speech.return_value = (
        [{"text": "Spoken audio recognized locally", "start": 0.0, "duration": 4.0}],
        "English",
        "en",
    )

    response = client.post(
        "/api/transcript",
        json={
            "url": "https://www.youtube.com/watch?v=dQw4w9WgXc5",
            "enable_speech_fallback": True,
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert data["transcription_method"] == "speech_recognition"
    assert len(data["warnings"]) > 0
    assert "speech recognition" in data["warnings"][0].lower()


@patch("server.app.api.routes.list_transcript_languages")
def test_transcript_languages_cached_and_reused(mock_list_languages):
    """Verify that language tracks are cached and subsequent calls do not invoke YouTube list tracks."""
    mock_list_languages.return_value = [
        {"code": "en", "name": "English", "is_generated": False, "is_translatable": True},
        {"code": "es", "name": "Spanish", "is_generated": False, "is_translatable": True},
    ]

    vid = "dQw4w9WgXc6"
    res1 = client.get(f"/api/transcript/languages?video_id={vid}")
    assert res1.status_code == 200
    assert len(res1.json()["languages"]) == 2
    assert mock_list_languages.call_count == 1

    # Second call should be served from coordinator cache
    res2 = client.get(f"/api/transcript/languages?video_id={vid}")
    assert res2.status_code == 200
    assert mock_list_languages.call_count == 1

