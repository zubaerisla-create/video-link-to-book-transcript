import os
import uuid
import asyncio
import shutil
import logging
from typing import List, Tuple, Optional, Dict, Any
from server.app.config import settings
from server.app.schemas.transcript import TranscriptSegment
from server.app.services.translation_service import get_language_display_name

logger = logging.getLogger("transcriptly.speech")

_whisper_model_instance = None
_model_lock = asyncio.Lock()
_concurrency_semaphore = asyncio.Semaphore(settings.SPEECH_MAX_CONCURRENT_JOBS)


class SpeechRecognitionError(Exception):
    def __init__(self, message: str, code: str = "SPEECH_RECOGNITION_FAILED", status_code: int = 500):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code


def is_ffmpeg_available() -> bool:
    """Checks if FFmpeg binary is available in PATH or via imageio_ffmpeg."""
    if shutil.which("ffmpeg"):
        return True
    try:
        import imageio_ffmpeg
        return bool(imageio_ffmpeg.get_ffmpeg_exe())
    except Exception:
        return False


def get_whisper_model():
    """Lazy-loads and caches faster-whisper model singleton."""
    global _whisper_model_instance
    if _whisper_model_instance is None:
        try:
            from faster_whisper import WhisperModel

            logger.info(
                f"Loading faster-whisper model '{settings.WHISPER_MODEL_SIZE}' "
                f"on {settings.WHISPER_DEVICE} ({settings.WHISPER_COMPUTE_TYPE})..."
            )
            _whisper_model_instance = WhisperModel(
                settings.WHISPER_MODEL_SIZE,
                device=settings.WHISPER_DEVICE,
                compute_type=settings.WHISPER_COMPUTE_TYPE,
            )
            logger.info("faster-whisper model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize faster-whisper model: {e}")
            raise SpeechRecognitionError(
                f"Could not load speech recognition model: {str(e)}",
                "MODEL_LOAD_FAILED",
                500
            )
    return _whisper_model_instance


def download_audio_stream(video_id: str) -> str:
    """
    Downloads audio stream for a public video using yt-dlp without bypassing authentication.
    Returns the path to the downloaded temporary audio file.
    """
    if not is_ffmpeg_available():
        raise SpeechRecognitionError(
            "FFmpeg is required for speech recognition audio processing, but was not found.",
            "FFMPEG_MISSING",
            500
        )

    os.makedirs(settings.AUDIO_TEMP_DIR, exist_ok=True)
    temp_id = uuid.uuid4().hex[:10]
    out_template = os.path.join(settings.AUDIO_TEMP_DIR, f"{video_id}_{temp_id}.%(ext)s")
    video_url = f"https://www.youtube.com/watch?v={video_id}"

    import yt_dlp

    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": out_template,
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "128",
            }
        ],
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        # Restrict to public accessible formats without bypassing restrictions
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # 1. Extract metadata first to check duration
            info = ydl.extract_info(video_url, download=False)
            if not info:
                raise SpeechRecognitionError("Video information could not be retrieved", "VIDEO_UNAVAILABLE", 404)

            duration = info.get("duration", 0)
            if duration and duration > settings.SPEECH_MAX_VIDEO_DURATION_SECONDS:
                max_mins = settings.SPEECH_MAX_VIDEO_DURATION_SECONDS // 60
                raise SpeechRecognitionError(
                    f"Video duration ({duration // 60} mins) exceeds the local speech recognition limit of {max_mins} minutes.",
                    "DURATION_LIMIT_EXCEEDED",
                    400
                )

            # 2. Download audio
            ydl.download([video_url])
    except yt_dlp.utils.DownloadError as e:
        err_msg = str(e)
        if "Private video" in err_msg or "Sign in" in err_msg:
            raise SpeechRecognitionError(
                "This video is private, restricted, or requires login. Speech recognition cannot access it.",
                "VIDEO_RESTRICTED",
                403
            )
        raise SpeechRecognitionError(f"Failed to download video audio stream: {err_msg}", "DOWNLOAD_FAILED", 500)
    except SpeechRecognitionError:
        raise
    except Exception as e:
        raise SpeechRecognitionError(f"Audio extraction failed: {str(e)}", "AUDIO_EXTRACTION_FAILED", 500)

    expected_file = os.path.join(settings.AUDIO_TEMP_DIR, f"{video_id}_{temp_id}.mp3")
    if not os.path.exists(expected_file):
        # Check if downloaded under another extension
        for ext in ("m4a", "webm", "opus", "wav"):
            alt = os.path.join(settings.AUDIO_TEMP_DIR, f"{video_id}_{temp_id}.{ext}")
            if os.path.exists(alt):
                return alt
        raise SpeechRecognitionError("Audio file was not produced after download", "AUDIO_EXTRACTION_FAILED", 500)

    return expected_file


async def transcribe_youtube_audio(video_id: str) -> Tuple[List[dict], str, str]:
    """
    Orchestrates local speech recognition via faster-whisper.
    Returns: (raw_segments, detected_language_name, detected_language_code)
    """
    if not settings.ENABLE_SPEECH_RECOGNITION:
        raise SpeechRecognitionError(
            "Local speech recognition fallback is currently disabled on the server.",
            "SPEECH_DISABLED",
            400
        )

    # Concurrency control
    async with _concurrency_semaphore:
        loop = asyncio.get_running_loop()

        # Step 1: Download audio
        audio_path = await loop.run_in_executor(None, download_audio_stream, video_id)

        try:
            # Step 2: Transcribe using cached faster-whisper model
            def _transcribe():
                model = get_whisper_model()
                # Auto-detect language
                segments, info = model.transcribe(
                    audio_path,
                    beam_size=5,
                    vad_filter=True,
                    vad_parameters=dict(min_silence_duration_ms=500),
                )
                
                raw_segs = []
                for s in segments:
                    clean = s.text.strip()
                    if clean:
                        raw_segs.append({
                            "text": clean,
                            "start": round(s.start, 2),
                            "duration": round(max(s.end - s.start, 0.2), 2),
                        })

                lang_code = info.language or "unknown"
                lang_name = get_language_display_name(lang_code)
                return raw_segs, lang_name, lang_code

            raw_segments, language_name, language_code = await loop.run_in_executor(None, _transcribe)

            if not raw_segments:
                raise SpeechRecognitionError(
                    "Speech recognition processed the audio but did not detect recognizable speech.",
                    "NO_SPEECH_DETECTED",
                    404
                )

            return raw_segments, language_name, language_code

        finally:
            # Step 3: Always clean up temporary audio file!
            if os.path.exists(audio_path):
                try:
                    os.remove(audio_path)
                except Exception as e:
                    logger.warning(f"Could not remove temporary audio file {audio_path}: {e}")
