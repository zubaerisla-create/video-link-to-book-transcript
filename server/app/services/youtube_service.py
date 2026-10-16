import re
import urllib.parse
from typing import Optional, List, Tuple, Any
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
    InvalidVideoId,
    YouTubeRequestFailed,
    YouTubeTranscriptApiException,
    TranslationLanguageNotAvailable,
)

from server.app.schemas.transcript import (
    TranscriptLanguage,
    TranscriptSegment,
    VideoInfo,
)


class YouTubeError(Exception):
    def __init__(self, message: str, code: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code


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

    # youtube.com/shorts/VIDEO_ID or youtube.com/embed/VIDEO_ID or youtube.com/v/VIDEO_ID
    match = re.match(r"^/(shorts|embed|v)/([a-zA-Z0-9_-]{11})", parsed.path)
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
        api = YouTubeTranscriptApi()
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
        raise YouTubeError("Video is unavailable or private", "VIDEO_UNAVAILABLE", 404)
    except (RequestBlocked, IpBlocked, PoTokenRequired):
        raise YouTubeError("YouTube caption access is temporarily rate-limited", "YOUTUBE_BLOCKED", 429)
    except InvalidVideoId:
        raise YouTubeError("Invalid YouTube video ID", "INVALID_URL", 400)
    except Exception as e:
        raise YouTubeError(f"Failed to list caption tracks: {str(e)}", "CAPTIONS_ERROR", 500)


def detect_original_track(track_list: List[Any]) -> Any:
    """
    Identifies the video's original spoken language caption track.
    - If an auto-generated track is present, its language represents the video's true spoken language.
      If a creator-uploaded manual track exists in that same language, prefer the manual track.
      Otherwise, use the auto-generated track.
    - If no auto-generated track exists, prefer the first manual track.
    - Fall back to the first available track.
    """
    if not track_list:
        return None

    # Check for auto-generated track (YouTube speech-recognition detected language)
    auto_track = next((t for t in track_list if getattr(t, "is_generated", False)), None)
    if auto_track:
        auto_lang = getattr(auto_track, "language_code", "").lower()
        # Look for a creator-uploaded manual track in that exact language
        matching_manual = next(
            (t for t in track_list if not getattr(t, "is_generated", False) and getattr(t, "language_code", "").lower() == auto_lang),
            None
        )
        if matching_manual:
            return matching_manual
        return auto_track

    # If no auto-generated track, choose the first creator-uploaded manual track
    manual_track = next((t for t in track_list if not getattr(t, "is_generated", False)), None)
    if manual_track:
        return manual_track

    # Fall back to first track
    return track_list[0]


def fetch_raw_transcript(
    video_id: str,
    preferred_language: Optional[str] = None
) -> Tuple[List[dict], str, str, bool, List[TranscriptLanguage], Any]:
    """
    Fetches raw transcript segments, respecting original language auto-detection,
    preferred language preference, and returns:
    (raw_segments, language_name, language_code, is_generated, available_languages, track_object)
    """
    try:
        api = YouTubeTranscriptApi()
        transcript_list = api.list(video_id)
    except TranscriptsDisabled:
        raise YouTubeError("Captions are disabled by the owner for this video", "NO_CAPTIONS", 404)
    except NoTranscriptFound:
        raise YouTubeError("No captions found for this video", "NO_CAPTIONS", 404)
    except (VideoUnavailable, VideoUnplayable):
        raise YouTubeError("Video is unavailable or private", "VIDEO_UNAVAILABLE", 404)
    except (RequestBlocked, IpBlocked, PoTokenRequired):
        raise YouTubeError("YouTube caption access is temporarily rate-limited. Please retry shortly.", "YOUTUBE_BLOCKED", 429)
    except InvalidVideoId:
        raise YouTubeError("Invalid YouTube video ID", "INVALID_URL", 400)
    except Exception as e:
        raise YouTubeError(f"Unable to retrieve captions: {str(e)}", "RETRIEVAL_FAILED", 500)

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

    # If no specific preferred language or preferred was 'auto', detect original language track!
    if not target_track:
        target_track = detect_original_track(track_list)

    try:
        fetched = target_track.fetch()
        raw_data = fetched.to_raw_data()
        lang_name = getattr(target_track, "language", "Unknown")
        lang_code = getattr(target_track, "language_code", "unknown")
        is_gen = getattr(target_track, "is_generated", False)
        return raw_data, lang_name, lang_code, is_gen, available_languages, target_track
    except Exception as e:
        raise YouTubeError(f"Failed to fetch subtitle content: {str(e)}", "FETCH_FAILED", 500)


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
