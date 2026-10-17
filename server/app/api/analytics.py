import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Request, Response, status, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from server.app.db.database import get_db
from server.app.db.models import User
from server.app.auth.security import get_current_user_optional
from server.app.services.analytics_service import (
    record_event,
    is_bot_user_agent,
    derive_browser,
    derive_os,
)

logger = logging.getLogger("transcriptly.analytics.api")
router = APIRouter(prefix="/analytics", tags=["Analytics Ingestion"])

ALLOWED_EVENT_TYPES = {
    "page_view",
    "import_attempt",
    "import_success",
    "import_failed",
    "transcript_extracted",
    "book_created",
    "user_registration",
    "user_login",
}


class CollectEventRequest(BaseModel):
    visitor_id: str = Field(..., min_length=8, max_length=64, description="Pseudonymous visitor UUID")
    session_id: str = Field(..., min_length=8, max_length=64, description="Session UUID")
    event_type: str = Field(..., min_length=2, max_length=64, description="Event type identifier")
    page_path: Optional[str] = Field(None, max_length=512, description="Sanitized relative URL path")
    referrer: Optional[str] = Field(None, max_length=255, description="Referring domain")
    device_type: Optional[str] = Field(None, max_length=32, description="desktop, mobile, or tablet")
    browser: Optional[str] = Field(None, max_length=32)
    os: Optional[str] = Field(None, max_length=32)
    duration_ms: Optional[int] = Field(None, ge=0, le=86400000)
    metadata: Optional[Dict[str, Any]] = Field(None, description="Non-sensitive metadata")


@router.post(
    "/collect",
    status_code=status.HTTP_200_OK,
    summary="Collect First-Party Analytics Event",
)
def collect_event(
    payload: CollectEventRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Ingests privacy-conscious client-side analytics events.
    Excludes automated bots, health checks, and admin page views.
    Never collects full IP addresses or sensitive transcript texts.
    """
    user_agent = request.headers.get("user-agent")

    # 1. Filter out known web crawlers, bots, and automated scripts
    if is_bot_user_agent(user_agent):
        return {"status": "ignored", "reason": "bot_detected"}

    # 2. Exclude admin traffic from inflating normal visitor counts
    if payload.page_path and payload.page_path.startswith("/admin"):
        return {"status": "ignored", "reason": "admin_route"}

    if current_user and (current_user.is_admin or getattr(current_user, "role", "user") == "admin"):
        # If admin is testing, do not inflate visitor count
        if payload.page_path and payload.page_path.startswith("/admin"):
            return {"status": "ignored", "reason": "admin_traffic"}

    # 3. Validate allowed event types
    clean_type = payload.event_type.strip().lower()
    if clean_type not in ALLOWED_EVENT_TYPES:
        return {"status": "ignored", "reason": "unknown_event_type"}

    # 4. Derive browser and OS if missing from payload
    browser = payload.browser or derive_browser(user_agent)
    os_name = payload.os or derive_os(user_agent)

    # 5. Extract referring domain cleanly
    referrer_domain = None
    if payload.referrer:
        import urllib.parse
        try:
            parsed = urllib.parse.urlparse(payload.referrer)
            referrer_domain = parsed.netloc or parsed.path
            referrer_domain = referrer_domain.lower()[:255]
        except Exception:
            referrer_domain = payload.referrer[:255]

    user_id = current_user.id if current_user else None

    # 6. Record event
    record_event(
        db=db,
        event_type=clean_type,
        visitor_id=payload.visitor_id,
        session_id=payload.session_id,
        user_id=user_id,
        page_path=payload.page_path,
        referrer_domain=referrer_domain,
        device_type=payload.device_type,
        browser=browser,
        os_name=os_name,
        duration_ms=payload.duration_ms,
        metadata=payload.metadata,
    )

    return {"status": "recorded"}
