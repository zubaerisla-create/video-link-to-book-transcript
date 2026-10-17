import os
import shutil
from pydantic import BaseModel

# Automatically load server/.env if present
env_candidates = [
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "server", ".env"),
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"),
    os.path.join(os.getcwd(), "server", ".env"),
    os.path.join(os.getcwd(), ".env"),
]
for candidate in env_candidates:
    if os.path.isfile(candidate):
        try:
            with open(candidate, "r", encoding="utf-8") as _f:
                for _line in _f:
                    _line = _line.strip()
                    if _line and not _line.startswith("#") and "=" in _line:
                        _k, _v = _line.split("=", 1)
                        os.environ.setdefault(_k.strip(), _v.strip())
        except Exception:
            pass
        break

class Settings(BaseModel):
    APP_NAME: str = "Transcriptly API"
    APP_VERSION: str = "1.2.0"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3005",
        "http://127.0.0.1:3005",
        "http://31.97.180.176",
        "http://31.97.180.176:80",
        "http://31.97.180.176:8080",
        "http://31.97.180.176:3005",
        "https://habd.tech",
        "https://www.habd.tech",
        "http://habd.tech",
        "http://www.habd.tech",
    ] + [
        origin.strip()
        for origin in os.getenv("ADDITIONAL_CORS_ORIGINS", "").split(",")
        if origin.strip()
    ]
    
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
    AUTH_RATE_LIMIT_PER_MINUTE: int = int(os.getenv("AUTH_RATE_LIMIT_PER_MINUTE", "15"))

    # Database Settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./transcriptly.db")

    # Security & JWT
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "transcriptly-insecure-dev-key-change-in-production-123456")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", str(60 * 24 * 7)))  # 7 days
    COOKIE_NAME: str = "transcriptly_auth_token"
    COOKIE_SECURE: bool = os.getenv("COOKIE_SECURE", "false").lower() in ("true", "1")

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

    # YouTube Proxy & Cookies Settings
    YOUTUBE_PROXY: str = os.getenv("YOUTUBE_PROXY", "")
    YOUTUBE_COOKIES_PATH: str = os.getenv("YOUTUBE_COOKIES_PATH", "")

    # Transcript Reliability, Concurrency & Caching Settings
    MAX_CONCURRENT_TRANSCRIPT_JOBS: int = int(os.getenv("MAX_CONCURRENT_TRANSCRIPT_JOBS", "3"))
    TRANSCRIPT_QUEUE_TIMEOUT_SECONDS: float = float(os.getenv("TRANSCRIPT_QUEUE_TIMEOUT_SECONDS", "15.0"))
    TRANSCRIPT_CACHE_TTL_SECONDS: int = int(os.getenv("TRANSCRIPT_CACHE_TTL_SECONDS", "600"))
    TRANSCRIPT_MAX_RETRIES: int = int(os.getenv("TRANSCRIPT_MAX_RETRIES", "2"))
    TRANSCRIPT_INITIAL_BACKOFF_SECONDS: float = float(os.getenv("TRANSCRIPT_INITIAL_BACKOFF_SECONDS", "1.0"))
    TRANSCRIPT_MAX_BACKOFF_SECONDS: float = float(os.getenv("TRANSCRIPT_MAX_BACKOFF_SECONDS", "8.0"))

    # SMTP Email Settings (Gmail)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "465"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "https://habd.tech")


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
