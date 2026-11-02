from __future__ import annotations

import html
import json
import logging
import re
import smtplib
import time
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from urllib.parse import urlparse
from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse

from server.app.config import settings

logger = logging.getLogger("transcriptly.contact")
router = APIRouter(tags=["Contact"])

SUBJECTS: dict[str, str] = {
    "general": "General inquiry",
    "bug": "Bug report",
    "feature": "Feature request",
    "privacy": "Privacy / data request",
    "copyright": "Copyright notice",
}

# Strict RFC-safe address pattern: rejects quotes, semicolons, comments, angle brackets, spaces, CR/LF
EMAIL_RE = re.compile(r"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$")
MAX_BODY_BYTES = 16 * 1024

IP_WINDOW_SECONDS = 10 * 60
IP_MAX = 5
GLOBAL_WINDOW_SECONDS = 60 * 60
GLOBAL_MAX = 60
MAX_TRACKED_IPS = 10_000

TRUSTED_PROXIES = {"127.0.0.1", "::1", "localhost", "testclient"}

_ip_hits: dict[str, list[float]] = {}
_global_hits: list[float] = []


def reset_contact_rate_limiter() -> None:
    """Resets in-memory contact rate limit counters for testing."""
    _ip_hits.clear()
    _global_hits.clear()


def _client_ip(request: Request) -> str:
    peer_ip = request.client.host if request.client else "127.0.0.1"
    if peer_ip in TRUSTED_PROXIES:
        real_ip = request.headers.get("x-real-ip")
        if real_ip and real_ip.strip():
            return real_ip.strip()
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            hops = [ip.strip() for ip in forwarded.split(",") if ip.strip()]
            if hops:
                return hops[-1]
    return peer_ip


def _prune_ip_hits(now: float) -> None:
    for ip, times in list(_ip_hits.items()):
        recent = [t for t in times if now - t < IP_WINDOW_SECONDS]
        if recent:
            _ip_hits[ip] = recent
        else:
            _ip_hits.pop(ip, None)


def _rate_limit(ip: str) -> str | None:
    global _global_hits
    now = time.time()

    _global_hits = [t for t in _global_hits if now - t < GLOBAL_WINDOW_SECONDS]
    if len(_global_hits) >= GLOBAL_MAX:
        return "global"

    if len(_ip_hits) > MAX_TRACKED_IPS:
        _prune_ip_hits(now)
        if len(_ip_hits) > MAX_TRACKED_IPS:
            return "saturated"

    recent = [t for t in _ip_hits.get(ip, []) if now - t < IP_WINDOW_SECONDS]
    if len(recent) >= IP_MAX:
        _ip_hits[ip] = recent
        return "ip"

    recent.append(now)
    _ip_hits[ip] = recent
    _global_hits.append(now)
    return None


def _same_origin(request: Request) -> bool:
    origin = request.headers.get("origin")
    if not origin:
        return True
    if origin in settings.CORS_ORIGINS:
        return True
    try:
        parsed = urlparse(origin)
        host = request.headers.get("host") or ""
        return bool(parsed.netloc and parsed.netloc == host)
    except Exception:
        return False


def send_contact_email(
    to_email: str,
    reply_to: str,
    subject: str,
    text_body: str,
    html_body: str,
) -> None:
    """Delivers the contact form email via configured Gmail SMTP."""
    from_addr = (settings.SMTP_FROM_EMAIL or settings.SMTP_USER).strip()
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"Transcriptly <{from_addr}>"
    msg["To"] = to_email
    msg["Reply-To"] = reply_to

    msg.attach(MIMEText(text_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    clean_pass = re.sub(r"\s+", "", settings.SMTP_PASSWORD)

    if settings.SMTP_PORT == 465:
        with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.login(settings.SMTP_USER, clean_pass)
            server.send_message(msg, to_addrs=[to_email])
    else:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(settings.SMTP_USER, clean_pass)
            server.send_message(msg, to_addrs=[to_email])


@router.post("/contact", summary="Submit Contact Form Message")
async def submit_contact_form(request: Request):
    to_email = (settings.CONTACT_TO_EMAIL or settings.SMTP_USER).strip()
    if not to_email or not settings.SMTP_USER.strip() or not settings.SMTP_PASSWORD.strip():
        logger.error("Contact form: SMTP_USER/SMTP_PASSWORD (and optionally CONTACT_TO_EMAIL) are not configured.")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "error": "The contact form is temporarily unavailable.",
                "detail": "The contact form is temporarily unavailable.",
            },
        )

    if not _same_origin(request):
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"error": "Forbidden.", "detail": "Forbidden."},
        )

    content_length = request.headers.get("content-length")
    if content_length and content_length.isdigit() and int(content_length) > MAX_BODY_BYTES:
        return JSONResponse(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            content={"error": "Message is too large.", "detail": "Message is too large."},
        )

    try:
        raw_bytes = await request.body()
    except Exception:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Invalid request.", "detail": "Invalid request."},
        )

    if len(raw_bytes) > MAX_BODY_BYTES:
        return JSONResponse(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            content={"error": "Message is too large.", "detail": "Message is too large."},
        )

    try:
        body = json.loads(raw_bytes.decode("utf-8"))
        if not isinstance(body, dict):
            raise ValueError("not an object")
    except Exception:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Invalid request.", "detail": "Invalid request."},
        )

    # Honeypot field: silently drop bot submissions without consuming rate limit or sending mail
    website_hp = body.get("website")
    if isinstance(website_hp, str) and website_hp.strip() != "":
        return JSONResponse(status_code=status.HTTP_200_OK, content={"success": True})

    name = str(body.get("name") or "").strip()
    email = str(body.get("email") or "").strip()
    subject_key = str(body.get("subject") or "general").strip()
    message = str(body.get("message") or "").strip()

    valid = (
        1 <= len(name) <= 120
        and 3 <= len(email) <= 254
        and bool(EMAIL_RE.fullmatch(email))
        and 10 <= len(message) <= 5000
        and not re.search(r"[\r\n]", name)
        and not re.search(r"[\r\n]", email)
    )
    if not valid:
        err_msg = "Please provide your name, a valid email and a message of 10–5000 characters."
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": err_msg, "detail": err_msg},
        )

    if _rate_limit(_client_ip(request)):
        err_msg = "Too many messages. Please try again later."
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"error": err_msg, "detail": err_msg},
        )

    subject_label = SUBJECTS.get(subject_key, SUBJECTS["general"])
    safe_name = html.escape(name, quote=True)
    safe_email = html.escape(email, quote=True)
    safe_topic = html.escape(subject_label, quote=True)
    safe_message = html.escape(message, quote=True)

    text_body = f"From: {name} <{email}>\nTopic: {subject_label}\n\n{message}"
    html_body = (
        f"<p><strong>From:</strong> {safe_name} &lt;{safe_email}&gt;<br/>"
        f"<strong>Topic:</strong> {safe_topic}</p>"
        f"<p style=\"white-space:pre-wrap\">{safe_message}</p>"
    )

    try:
        send_contact_email(
            to_email=to_email,
            reply_to=email,
            subject=f"[Transcriptly contact] {subject_label} — {name}",
            text_body=text_body,
            html_body=html_body,
        )
        return JSONResponse(status_code=status.HTTP_200_OK, content={"success": True})
    except Exception as exc:
        logger.error("Contact form send error: %s", type(exc).__name__)
        err_msg = "Your message could not be sent. Please try again later."
        return JSONResponse(
            status_code=status.HTTP_502_BAD_GATEWAY,
            content={"error": err_msg, "detail": err_msg},
        )
