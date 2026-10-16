import time
import logging
from collections import defaultdict
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from server.app.config import settings
from server.app.api.routes import router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("transcriptly")

# In-memory rate limiter per IP
class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 60, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.ip_records = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        # Allow health check without rate limit
        if request.url.path == "/api/health":
            return await call_next(request)

        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()
        timestamps = self.ip_records[client_ip]

        # Prune old timestamps
        valid_timestamps = [t for t in timestamps if now - t < self.window_seconds]
        if len(valid_timestamps) >= self.max_requests:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Too many requests. Please slow down and try again shortly.",
                    "code": "RATE_LIMIT_EXCEEDED",
                },
            )

        valid_timestamps.append(now)
        self.ip_records[client_ip] = valid_timestamps
        response = await call_next(request)
        return response


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Clean, reliable YouTube transcript extraction API.",
    docs_url="/docs",
    redoc_url="/redoc",
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
    window_seconds=60,
)

# Global unhandled exception handler to prevent raw traceback leakage
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
app.include_router(router)
