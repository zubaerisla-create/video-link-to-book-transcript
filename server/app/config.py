import os
import shutil
from pydantic import BaseModel

class Settings(BaseModel):
    APP_NAME: str = "Transcriptly API"
    APP_VERSION: str = "1.1.0"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))

    # Speech Recognition (faster-whisper) Settings
    ENABLE_SPEECH_RECOGNITION: bool = os.getenv("ENABLE_SPEECH_RECOGNITION", "true").lower() in ("true", "1")
    WHISPER_MODEL_SIZE: str = os.getenv("WHISPER_MODEL_SIZE", "tiny")
    WHISPER_DEVICE: str = os.getenv("WHISPER_DEVICE", "cpu")
    WHISPER_COMPUTE_TYPE: str = os.getenv("WHISPER_COMPUTE_TYPE", "int8")
    SPEECH_MAX_VIDEO_DURATION_SECONDS: int = int(os.getenv("SPEECH_MAX_VIDEO_DURATION_SECONDS", "1800"))
    SPEECH_MAX_CONCURRENT_JOBS: int = int(os.getenv("SPEECH_MAX_CONCURRENT_JOBS", "2"))
    AUDIO_TEMP_DIR: str = os.getenv("AUDIO_TEMP_DIR", "/tmp/transcriptly_audio")

    # Translation Settings
    DEFAULT_TRANSLATION_PROVIDER: str = os.getenv("DEFAULT_TRANSLATION_PROVIDER", "auto")


settings = Settings()

# Ensure FFmpeg is available in PATH
try:
    import imageio_ffmpeg
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    ffmpeg_dir = os.path.dirname(ffmpeg_exe)
    if ffmpeg_dir not in os.environ.get("PATH", ""):
        os.environ["PATH"] = f"{ffmpeg_dir}:{os.environ.get('PATH', '')}"
except Exception:
    pass
