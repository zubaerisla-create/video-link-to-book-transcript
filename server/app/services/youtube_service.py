import re
import urllib.parse
import logging
import random
import asyncio
import inspect
from typing import Optional, List, Tuple, Any, Callable
import httpx
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    TranscriptsDisabled,
    NoTranscriptFound,
    VideoUnavailable,
    VideoUnplayable,
    RequestBlocked,
    IpBlocked,
    PoTokenRequired,
    AgeRestricted,
    InvalidVideoId,
    YouTubeRequestFailed,
    YouTubeTranscriptApiException,
    TranslationLanguageNotAvailable,
)

import os
import http.cookiejar
import requests
from requests.exceptions import HTTPError
from youtube_transcript_api.proxies import GenericProxyConfig
from server.app.config import settings
from server.app.services.transcript_coordinator import sanitize_details

from server.app.schemas.transcript import (
    TranscriptLanguage,
    TranscriptSegment,
    VideoInfo,
)


class YouTubeError(Exception):
    def __init__(
        self,
        message: str,
        code: str,
        status_code: int = 400,
        retry_after: Optional[int] = None,
        retryable: Optional[bool] = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.retry_after = retry_after
        if retryable is not None:
            self.retryable = retryable
        else:
            self.retryable = status_code in (429, 502, 503, 504)


logger = logging.getLogger("transcriptly.youtube")


def extract_retry_after(exc: Exception) -> Optional[int]:
    """
    Safely extracts Retry-After in seconds from exception or response headers if present.
    Also extracts from string exception messages when available.
    """
    resp = getattr(exc, "response", None) or getattr(getattr(exc, "http_error", None), "response", None)
    if resp is not None and hasattr(resp, "headers"):
        val = resp.headers.get("Retry-After")
        if val:
            try:
                seconds = int(val)
                if seconds > 0:
                    return seconds
            except ValueError:
                pass

    # Fallback to inspecting exception message
    msg = str(exc)
    match = re.search(r"retry\s+(?:in|after)\s+(\d+)\s*s(?:ec(?:ond)?s?)?", msg, re.IGNORECASE)
    if match:
        try:
            return int(match.group(1))
        except ValueError:
            pass

    return None


def get_youtube_transcript_api() -> YouTubeTranscriptApi:
    """
    Initializes YouTubeTranscriptApi with optional proxy configuration
    and loaded browser cookies if available.
    """
    proxy_config = None
    if settings.YOUTUBE_PROXY:
        proxy_config = GenericProxyConfig(
            http_url=settings.YOUTUBE_PROXY,
            https_url=settings.YOUTUBE_PROXY,
        )

    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
    })

    cookie_path = settings.YOUTUBE_COOKIES_PATH or (
        "/var/www/transcriptly/cookies.txt" if os.path.exists("/var/www/transcriptly/cookies.txt") else (
            "cookies.txt" if os.path.exists("cookies.txt") else ""
        )
    )
    if cookie_path and os.path.exists(cookie_path):
        try:
            jar = http.cookiejar.MozillaCookieJar(cookie_path)
            jar.load(ignore_discard=True, ignore_expires=True)
            session.cookies = jar
            logger.info("Loaded YouTube cookies from %s", cookie_path)
        except Exception as e:
            logger.warning("Failed to load cookie file %s: %s", cookie_path, e)

    return YouTubeTranscriptApi(proxy_config=proxy_config, http_client=session)


def extract_video_id(url_or_id: str) -> str:
    """
    Extracts and validates an 11-character YouTube video ID from various URL formats.
    Supported formats:
    - https://www.youtube.com/watch?v=VIDEO_ID
    - https://youtube.com/watch?v=VIDEO_ID
    - https://m.youtube.com/watch?v=VIDEO_ID
    - https://youtu.be/VIDEO_ID
    - https://www.youtube.com/shorts/VIDEO_ID
    - https://www.youtube.com/embed/VIDEO_ID
    - https://www.youtube.com/v/VIDEO_ID
    - Direct 11-character video ID
    """
    if not url_or_id or not isinstance(url_or_id, str):
        raise YouTubeError("YouTube URL or Video ID cannot be empty", "INVALID_URL", 400)

    clean_str = url_or_id.strip()

    # If it's already an 11-char ID matching standard video ID characters
    if re.fullmatch(r"[a-zA-Z0-9_-]{11}", clean_str):
        return clean_str

    try:
        parsed = urllib.parse.urlparse(clean_str)
    except Exception:
        raise YouTubeError("Invalid URL format", "INVALID_URL", 400)

    hostname = (parsed.hostname or "").lower()
    
    valid_hosts = {
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "music.youtube.com",
        "youtu.be",
        "www.youtu.be",
    }

    if hostname not in valid_hosts and not hostname.endswith(".youtube.com") and not hostname.endswith(".youtu.be"):
        raise YouTubeError("URL must be a valid YouTube link", "INVALID_URL", 400)

    # youtu.be/VIDEO_ID
    if "youtu.be" in hostname:
        path = parsed.path.lstrip("/")
        video_id = path.split("/")[0] if path else ""
        if re.fullmatch(r"[a-zA-Z0-9_-]{11}", video_id):
            return video_id

    # youtube.com/watch?v=VIDEO_ID
    if parsed.path in ["/watch", "/watch/"]:
        query_params = urllib.parse.parse_qs(parsed.query)
        v_list = query_params.get("v")
        if v_list and len(v_list) > 0:
            video_id = v_list[0]
            if re.fullmatch(r"[a-zA-Z0-9_-]{11}", video_id):
                return video_id

    # youtube.com/shorts/VIDEO_ID, /embed/VIDEO_ID, /live/VIDEO_ID, or /v/VIDEO_ID
    match = re.match(r"^/(shorts|embed|v|live)/([a-zA-Z0-9_-]{11})", parsed.path)
    if match:
        return match.group(2)

    raise YouTubeError(
        "Could not extract a valid 11-character YouTube video ID from the provided link",
        "INVALID_URL",
        400
    )


async def get_video_info(video_id: str) -> Optional[VideoInfo]:
    """
    Retrieves video metadata (title, author, thumbnail) using YouTube oEmbed.
    oEmbed is an official YouTube standard endpoint that requires no API keys.
    Gracefully returns None if unavailable.
    """
    oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.get(oembed_url)
            if resp.status_code == 200:
                data = resp.json()
                return VideoInfo(
                    video_id=video_id,
                    title=data.get("title"),
                    author=data.get("author_name"),
                    thumbnail_url=data.get("thumbnail_url"),
                )
    except Exception:
        pass

    return None


def list_transcript_languages(video_id: str) -> List[TranscriptLanguage]:
    """
    Lists available transcript tracks for the video.
    """
    try:
        api = get_youtube_transcript_api()
        transcript_list = api.list(video_id)
        result: List[TranscriptLanguage] = []
        for t in transcript_list:
            result.append(
                TranscriptLanguage(
                    code=t.language_code,
                    name=t.language,
                    is_generated=t.is_generated,
                    is_translatable=t.is_translatable,
                )
            )
        return result
    except (TranscriptsDisabled, NoTranscriptFound):
        return []
    except (VideoUnavailable, VideoUnplayable):
        raise YouTubeError("Video is unavailable or private", "VIDEO_UNAVAILABLE", 404, retryable=False)
    except AgeRestricted:
        logger.warning("YouTube video is age-restricted / requires authentication: %s", video_id)
        raise YouTubeError(
            "This video is age-restricted and requires YouTube login. Please use the Transcriptly Chrome Extension.",
            "AGE_RESTRICTED",
            403,
            retryable=False,
        )
    except PoTokenRequired:
        logger.warning("YouTube requested Proof-of-Origin token for %s", video_id)
        raise YouTubeError(
            "This video requires YouTube Proof-of-Origin verification. Please use the Transcriptly Chrome Extension.",
            "PO_TOKEN_REQUIRED",
            403,
            retryable=False,
        )
    except IpBlocked as e:
        retry_after = extract_retry_after(e)
        logger.warning(
            "YouTube datacenter IP block detected while listing tracks for %s: exc=IpBlocked, sanitized=%s",
            video_id,
            sanitize_details(e),
        )
        raise YouTubeError(
            "The server IP address is currently restricted by YouTube bot-detection policies. Please use the Transcriptly Chrome Extension or upload a subtitle file.",
            "IP_BLOCKED",
            403,
            retry_after=retry_after,
            retryable=False,
        )
    except RequestBlocked as e:
        retry_after = extract_retry_after(e)
        logger.warning(
            "YouTube bot-detection block detected while listing tracks for %s: exc=RequestBlocked, sanitized=%s",
            video_id,
            sanitize_details(e),
        )
        raise YouTubeError(
            "YouTube has restricted automated requests ('Sign in to confirm you’re not a bot'). Please use the Transcriptly Chrome Extension.",
            "REQUEST_BLOCKED",
            403,
            retry_after=retry_after,
            retryable=False,
        )
    except InvalidVideoId:
        raise YouTubeError("Invalid YouTube video ID", "INVALID_URL", 400, retryable=False)
    except YouTubeRequestFailed as e:
        retry_after = extract_retry_after(e)
        sanitized = sanitize_details(e)
        http_status = getattr(getattr(getattr(e, "http_error", None), "response", None), "status_code", None)
        if http_status == 429:
            logger.warning("Upstream YouTube rate limit (429) while listing tracks for %s: retry_after=%s", video_id, retry_after)
            raise YouTubeError(
                "YouTube caption access is temporarily rate-limited. Please retry shortly.",
                "RATE_LIMITED",
                429,
                retry_after=retry_after,
                retryable=True,
            )
        elif http_status == 403:
            logger.warning("Upstream YouTube forbidden (403) while listing tracks for %s: %s", video_id, sanitized)
            raise YouTubeError(
                "Access to YouTube captions is restricted. Please use the Transcriptly Chrome Extension.",
                "REQUEST_BLOCKED",
                403,
                retryable=False,
            )
        elif http_status in (502, 503, 504):
            logger.warning("Upstream YouTube service unavailable (%s) while listing tracks for %s", http_status, video_id)
            raise YouTubeError(
                "YouTube service is temporarily unavailable. Please retry shortly.",
                "UPSTREAM_UNAVAILABLE",
                503,
                retry_after=retry_after or 5,
                retryable=True,
            )
        else:
            logger.error("YouTubeRequestFailed listing tracks for %s (status=%s): %s", video_id, http_status, sanitized)
            raise YouTubeError(f"Failed to list caption tracks: {sanitized}", "CAPTIONS_ERROR", 500, retry_after=retry_after, retryable=False)
    except Exception as e:
        retry_after = extract_retry_after(e)
        sanitized = sanitize_details(e)
        logger.error(
            "Unexpected error listing caption tracks for %s: exc=%s, sanitized=%s",
            video_id,
            type(e).__name__,
            sanitized,
        )
        raise YouTubeError(f"Failed to list caption tracks: {sanitized}", "CAPTIONS_ERROR", 500, retry_after=retry_after, retryable=False)


def detect_script_language(text: Optional[str]) -> Optional[str]:
    """
    Infers likely language from non-Latin Unicode scripts in the title or text.
    Returns language code (e.g. 'bn', 'hi', 'ar', 'ur', etc.) or None if ambiguous / Latin.
    """
    if not text or not isinstance(text, str):
        return None

    # Bengali / Bangla: U+0980 - U+09FF
    if re.search(r"[\u0980-\u09FF]", text):
        return "bn"
    # Devanagari (Hindi): U+0900 - U+097F
    if re.search(r"[\u0900-\u097F]", text):
        return "hi"
    # Urdu-specific characters check before generic Arabic
    if re.search(r"[\u0679\u0686\u0698\u0695\u06BA\u06BE\u06C1\u06D2]", text):
        return "ur"
    # Arabic: U+0600 - U+06FF, U+0750 - U+077F
    if re.search(r"[\u0600-\u06FF\u0750-\u077F]", text):
        return "ar"
    # Japanese (Hiragana / Katakana): U+3040 - U+30FF
    if re.search(r"[\u3040-\u309F\u30A0-\u30FF]", text):
        return "ja"
    # Korean (Hangul): U+AC00 - U+D7AF, U+1100 - U+11FF
    if re.search(r"[\uAC00-\uD7AF\u1100-\u11FF]", text):
        return "ko"
    # Chinese (CJK Unified): U+4E00 - U+9FFF
    if re.search(r"[\u4E00-\u9FFF]", text):
        return "zh"
    # Cyrillic (Russian, etc.): U+0400 - U+04FF
    if re.search(r"[\u0400-\u04FF]", text):
        return "ru"
    # Tamil: U+0B80 - U+0BFF
    if re.search(r"[\u0B80-\u0BFF]", text):
        return "ta"
    # Telugu: U+0C00 - U+0C7F
    if re.search(r"[\u0C00-\u0C7F]", text):
        return "te"
    # Malayalam: U+0D00 - U+0D7F
    if re.search(r"[\u0D00-\u0D7F]", text):
        return "ml"
    # Kannada: U+0C80 - U+0CFF
    if re.search(r"[\u0C80-\u0CFF]", text):
        return "kn"
    # Gujarati: U+0A80 - U+0AFF
    if re.search(r"[\u0A80-\u0AFF]", text):
        return "gu"
    # Gurmukhi (Punjabi): U+0A00 - U+0A7F
    if re.search(r"[\u0A00-\u0A7F]", text):
        return "pa"
    # Thai: U+0E00 - U+0E7F
    if re.search(r"[\u0E00-\u0E7F]", text):
        return "th"

    return None


def detect_original_track(track_list: List[Any], video_title: Optional[str] = None) -> Any:
    """
    Identifies the video's original spoken language caption track by inspecting all available tracks.
    Does not infer original language solely from the first available track.
    
    1. If video title exhibits a distinctive script (e.g. Bengali, Devanagari, Arabic):
       - Prioritizes manual tracks matching that script's language code.
       - Then checks auto-generated tracks matching that script's language code.
       - If no tracks match the script and the only available track is an auto-generated
         track in a conflicting language (e.g. auto 'en' on a Bangla-titled video), returns None
         so caller can fall back to speech recognition rather than serving erroneous captions.
    2. If creator-uploaded manual tracks exist:
       - Check if an auto-generated track matches one of the manual tracks (indicates native speech).
       - Otherwise prefers the primary creator-uploaded manual track.
    3. If only auto-generated tracks exist and no script conflict:
       - Returns the auto-generated track.
    """
    if not track_list:
        return None

    title_lang = detect_script_language(video_title)
    if title_lang:
        # Check for manual creator track matching title language
        for t in track_list:
            t_code = getattr(t, "language_code", "").lower()
            if not getattr(t, "is_generated", False) and (t_code == title_lang or t_code.startswith(f"{title_lang}-")):
                logger.info("Matched manual creator caption track for title language '%s': %s", title_lang, t_code)
                return t

        # Check for auto-generated track matching title language
        for t in track_list:
            t_code = getattr(t, "language_code", "").lower()
            if getattr(t, "is_generated", False) and (t_code == title_lang or t_code.startswith(f"{title_lang}-")):
                logger.info("Matched auto-generated caption track for title language '%s': %s", title_lang, t_code)
                return t

        # Title is in a specific non-Latin script, but no track matches that language.
        # If available tracks are only auto-generated tracks in another language (e.g., 'en'),
        # this is a known YouTube auto-caption misclassification anomaly.
        only_generated = all(getattr(t, "is_generated", False) for t in track_list)
        if only_generated:
            logger.warning(
                "Video title script indicates '%s', but available tracks (%s) do not contain '%s'. "
                "Auto-generated tracks conflict with title script. Declaring original captions unavailable.",
                title_lang,
                [getattr(t, "language_code", "") for t in track_list],
                title_lang,
            )
            return None

    # If title script did not match, check manual vs auto-generated tracks
    auto_track = next((t for t in track_list if getattr(t, "is_generated", False)), None)
    if auto_track:
        auto_lang = getattr(auto_track, "language_code", "").lower().split("-")[0]
        # Look for a creator-uploaded manual track in that same language
        matching_manual = next(
            (t for t in track_list if not getattr(t, "is_generated", False) and getattr(t, "language_code", "").lower().split("-")[0] == auto_lang),
            None
        )
        if matching_manual:
            return matching_manual

    # Prioritize creator-uploaded manual tracks over auto-generated ones
    manual_track = next((t for t in track_list if not getattr(t, "is_generated", False)), None)
    if manual_track:
        return manual_track

    # Fall back to auto-generated track if present
    if auto_track:
        return auto_track

    return track_list[0]


def fetch_raw_transcript(
    video_id: str,
    preferred_language: Optional[str] = None,
    video_title: Optional[str] = None,
) -> Tuple[List[dict], str, str, bool, List[TranscriptLanguage], Any]:
    """
    Fetches raw transcript segments, respecting original language auto-detection,
    preferred language preference, and returns:
    (raw_segments, language_name, language_code, is_generated, available_languages, track_object)
    """
    try:
        api = get_youtube_transcript_api()
        transcript_list = api.list(video_id)
    except TranscriptsDisabled:
        raise YouTubeError("Captions are disabled by the owner for this video", "NO_CAPTIONS", 404, retryable=False)
    except NoTranscriptFound:
        raise YouTubeError("No captions found for this video", "NO_CAPTIONS", 404, retryable=False)
    except (VideoUnavailable, VideoUnplayable):
        raise YouTubeError("Video is unavailable or private", "VIDEO_UNAVAILABLE", 404, retryable=False)
    except AgeRestricted:
        logger.warning("YouTube video is age-restricted / requires authentication for %s", video_id)
        raise YouTubeError(
            "This video is age-restricted and requires YouTube login. Please use the Transcriptly Chrome Extension while logged into YouTube.",
            "AGE_RESTRICTED",
            403,
            retryable=False,
        )
    except PoTokenRequired:
        logger.warning("YouTube requested Proof-of-Origin token for %s", video_id)
        raise YouTubeError(
            "This video requires YouTube Proof-of-Origin verification. Please use the Transcriptly Chrome Extension to access captions directly from your browser.",
            "PO_TOKEN_REQUIRED",
            403,
            retryable=False,
        )
    except IpBlocked as e:
        retry_after = extract_retry_after(e)
        logger.warning(
            "YouTube datacenter IP block detected for %s: exc=IpBlocked, sanitized=%s",
            video_id,
            sanitize_details(e),
        )
        raise YouTubeError(
            "The server IP address is currently restricted by YouTube bot-detection policies. Please use the Transcriptly Chrome Extension or upload a subtitle file to extract transcripts without server IP restrictions.",
            "IP_BLOCKED",
            403,
            retry_after=retry_after,
            retryable=False,
        )
    except RequestBlocked as e:
        retry_after = extract_retry_after(e)
        logger.warning(
            "YouTube bot-detection block detected for %s: exc=RequestBlocked, sanitized=%s",
            video_id,
            sanitize_details(e),
        )
        raise YouTubeError(
            "YouTube has restricted automated access ('Sign in to confirm you’re not a bot'). Please use the Transcriptly Chrome Extension to import transcripts directly from your browser.",
            "REQUEST_BLOCKED",
            403,
            retry_after=retry_after,
            retryable=False,
        )
    except InvalidVideoId:
        raise YouTubeError("Invalid YouTube video ID", "INVALID_URL", 400, retryable=False)
    except YouTubeRequestFailed as e:
        retry_after = extract_retry_after(e)
        sanitized = sanitize_details(e)
        http_status = getattr(getattr(getattr(e, "http_error", None), "response", None), "status_code", None)
        if http_status == 429:
            logger.warning("Upstream YouTube rate limit (429) for %s: retry_after=%s", video_id, retry_after)
            raise YouTubeError(
                "YouTube caption access is temporarily rate-limited. Please retry shortly.",
                "RATE_LIMITED",
                429,
                retry_after=retry_after,
                retryable=True,
            )
        elif http_status == 403:
            logger.warning("Upstream YouTube forbidden (403) for %s: %s", video_id, sanitized)
            raise YouTubeError(
                "Access to YouTube captions is restricted. Please use the Transcriptly Chrome Extension.",
                "REQUEST_BLOCKED",
                403,
                retryable=False,
            )
        elif http_status in (502, 503, 504):
            logger.warning("Upstream YouTube service unavailable (%s) for %s", http_status, video_id)
            raise YouTubeError(
                "YouTube service is temporarily unavailable. Please retry shortly.",
                "UPSTREAM_UNAVAILABLE",
                503,
                retry_after=retry_after or 5,
                retryable=True,
            )
        else:
            logger.error("YouTubeRequestFailed for %s (status=%s): %s", video_id, http_status, sanitized)
            raise YouTubeError(f"Unable to retrieve captions: {sanitized}", "RETRIEVAL_FAILED", 500, retry_after=retry_after, retryable=False)
    except Exception as e:
        retry_after = extract_retry_after(e)
        sanitized = sanitize_details(e)
        logger.error(
            "Unexpected error retrieving captions for %s: exc=%s, sanitized=%s",
            video_id,
            type(e).__name__,
            sanitized,
        )
        raise YouTubeError(f"Unable to retrieve captions: {sanitized}", "RETRIEVAL_FAILED", 500, retry_after=retry_after, retryable=False)

    track_list = list(transcript_list)
    available_languages: List[TranscriptLanguage] = []
    for t in track_list:
        available_languages.append(
            TranscriptLanguage(
                code=t.language_code,
                name=t.language,
                is_generated=t.is_generated,
                is_translatable=t.is_translatable,
            )
        )

    logger.info(
        "Available caption tracks for %s: %s",
        video_id,
        [(t.language_code, t.language, "generated" if t.is_generated else "manual") for t in track_list],
    )

    if not track_list:
        raise YouTubeError("No accessible caption tracks available for this video", "NO_CAPTIONS", 404)

    target_track = None

    # If user provided a specific language code (other than 'auto')
    if preferred_language and preferred_language.lower() != "auto":
        pref = preferred_language.lower().strip()
        # Look for manual exact match
        for t in track_list:
            if not t.is_generated and t.language_code.lower() == pref:
                target_track = t
                break
        # Look for generated exact match
        if not target_track:
            for t in track_list:
                if t.is_generated and t.language_code.lower() == pref:
                    target_track = t
                    break
        # Look for prefix match (e.g. 'en' matches 'en-US')
        if not target_track:
            for t in track_list:
                if t.language_code.lower().startswith(pref):
                    target_track = t
                    break

        # When a specific preferred language is requested, do not fall back to an unrelated track
        if not target_track:
            logger.warning("Requested preferred language '%s' not found in available tracks for %s", preferred_language, video_id)
            raise YouTubeError(f"No caption track found for language '{preferred_language}'", "NO_CAPTIONS", 404)
    else:
        # Auto-detect original language track
        target_track = detect_original_track(track_list, video_title=video_title)

    if not target_track:
        raise YouTubeError("Original language captions are unavailable for this video", "NO_CAPTIONS", 404)

    try:
        fetched = target_track.fetch()
        raw_data = fetched.to_raw_data()
        lang_name = getattr(target_track, "language", "Unknown")
        lang_code = getattr(target_track, "language_code", "unknown")
        is_gen = getattr(target_track, "is_generated", False)
        logger.info(
            "Selected caption track for %s: code='%s', name='%s', is_generated=%s, is_translated=False",
            video_id,
            lang_code,
            lang_name,
            is_gen,
        )
        return raw_data, lang_name, lang_code, is_gen, available_languages, target_track
    except (RequestBlocked, IpBlocked, PoTokenRequired) as e:
        retry_after = extract_retry_after(e)
        logger.warning(
            "Upstream YouTube caption content download blocked for %s: exc=%s, sanitized=%s",
            video_id,
            type(e).__name__,
            sanitize_details(e),
        )
        if isinstance(e, IpBlocked):
            raise YouTubeError(
                "The server IP address is currently restricted by YouTube bot-detection policies. Please use the Transcriptly Chrome Extension or upload a subtitle file.",
                "IP_BLOCKED",
                403,
                retry_after=retry_after,
                retryable=False,
            )
        elif isinstance(e, PoTokenRequired):
            raise YouTubeError(
                "This video requires YouTube Proof-of-Origin verification. Please use the Transcriptly Chrome Extension.",
                "PO_TOKEN_REQUIRED",
                403,
                retryable=False,
            )
        else:
            raise YouTubeError(
                "YouTube has restricted automated access ('Sign in to confirm you’re not a bot'). Please use the Transcriptly Chrome Extension.",
                "REQUEST_BLOCKED",
                403,
                retry_after=retry_after,
                retryable=False,
            )
    except Exception as e:
        retry_after = extract_retry_after(e)
        sanitized = sanitize_details(e)
        raise YouTubeError(f"Failed to fetch subtitle content: {sanitized}", "FETCH_FAILED", 500, retry_after=retry_after, retryable=False)


def try_youtube_translate_track(track_object: Any, target_language: str) -> Optional[List[dict]]:
    """
    Attempts to use YouTube's built-in translation on the track object if supported.
    Returns raw segments if successful, or None if unsupported/unavailable.
    """
    if not track_object or not getattr(track_object, "is_translatable", False):
        return None

    try:
        # Check if target_language is in supported translation languages
        trans_langs = getattr(track_object, "translation_languages", [])
        target_clean = target_language.lower().strip()
        is_supported = any(
            getattr(tl, "language_code", "").lower() == target_clean or
            getattr(tl, "language_code", "").lower().startswith(target_clean)
            for tl in trans_langs
        )
        if not is_supported:
            return None

        translated_track = track_object.translate(target_language)
        fetched = translated_track.fetch()
        return fetched.to_raw_data()
    except (TranslationLanguageNotAvailable, Exception):
        return None


async def fetch_raw_transcript_with_retry(
    video_id: str,
    preferred_language: Optional[str] = None,
    video_title: Optional[str] = None,
    fetcher: Optional[Callable] = None,
) -> Tuple[List[dict], str, str, bool, List[TranscriptLanguage], Any]:
    """
    Executes fetch_raw_transcript with bounded exponential backoff and jitter for transient throttling.
    Never loops indefinitely. Respects Retry-After when available.
    Does not retry permanent errors, IP blocks, permission errors, or missing captions.
    """
    if fetcher is None:
        fetcher = fetch_raw_transcript

    max_retries = max(0, settings.TRANSCRIPT_MAX_RETRIES)
    attempt = 0

    while True:
        try:
            res = fetcher(
                video_id=video_id,
                preferred_language=preferred_language,
                video_title=video_title,
            )
            if inspect.isawaitable(res):
                return await res
            return res
        except YouTubeError as ye:
            if not getattr(ye, "retryable", False) or attempt >= max_retries:
                raise

            retry_after = ye.retry_after
            # If retry_after exceeds maximum allowed transient backoff, abort retry and let caller handle
            if retry_after and retry_after > settings.TRANSCRIPT_MAX_BACKOFF_SECONDS:
                logger.info(
                    "Retry-After (%ss) exceeds max transient backoff (%ss) for %s; aborting immediate retry.",
                    retry_after,
                    settings.TRANSCRIPT_MAX_BACKOFF_SECONDS,
                    video_id,
                )
                raise

            # Bounded exponential backoff with random jitter
            base_delay = (
                retry_after
                if (retry_after and retry_after <= settings.TRANSCRIPT_MAX_BACKOFF_SECONDS)
                else (settings.TRANSCRIPT_INITIAL_BACKOFF_SECONDS * (2 ** attempt))
            )
            jitter = random.uniform(-0.25, 0.25)
            delay = max(0.5, min(base_delay + jitter, settings.TRANSCRIPT_MAX_BACKOFF_SECONDS))

            attempt += 1
            logger.warning(
                "Transient throttling encountered for %s (attempt %d/%d). Backing off for %.2fs...",
                video_id,
                attempt,
                max_retries,
                delay,
            )
            await asyncio.sleep(delay)
