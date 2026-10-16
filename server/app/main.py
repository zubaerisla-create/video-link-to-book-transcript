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
from server.app.api.routes import router as transcript_router
from server.app.api.auth import router as auth_router
from server.app.api.books import router as books_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("transcriptly")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on application startup
    try:
        logger.info("Initializing database schema...")
        init_db()
        logger.info("Database schema initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}", exc_info=True)
    yield


def extract_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        first_ip = forwarded.split(",")[0].strip()
        if first_ip:
            return first_ip
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    return request.client.host if request.client else "127.0.0.1"


# In-memory rate limiter per IP with strict limits on auth
class RateLimitMiddleware(BaseHTTPMiddleware):
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

    async def dispatch(self, request: Request, call_next):
        # Allow health check without rate limit
        path = request.url.path
        if path == "/api/health":
            return await call_next(request)

        client_ip = extract_client_ip(request)
        now = time.time()

        # Stricter rate limit on auth endpoints (brute force mitigation)
        if path in ("/api/auth/login", "/api/auth/signup"):
            auth_timestamps = [
                t for t in self.auth_ip_records[client_ip] if now - t < self.window_seconds
            ]
            if len(auth_timestamps) >= self.auth_max_requests:
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
        timestamps = self.ip_records[client_ip]
        valid_timestamps = [t for t in timestamps if now - t < self.window_seconds]
        if len(valid_timestamps) >= self.max_requests:
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
