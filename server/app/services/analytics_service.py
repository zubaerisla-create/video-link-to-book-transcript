import json
import logging
import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List, Tuple
from sqlalchemy import func, desc, and_, text, case
from sqlalchemy.orm import Session

from server.app.db.models import (
    User,
    Book,
    AnalyticsEvent,
    AdminAuditLog,
    ReadingSession,
    UserSavedWord,
    get_utc_now,
)

logger = logging.getLogger("transcriptly.analytics")

BOT_PATTERNS = [
    "bot", "crawler", "spider", "slurp", "headless", "lighthouse",
    "googlebot", "bingbot", "yandex", "duckduckbot", "baiduspider",
    "curl", "wget", "python-requests", "aiohttp", "postman", "go-http-client",
]

SENSITIVE_KEYS = {
    "password", "token", "secret", "authorization", "jwt", "key",
    "transcript", "paragraphs", "segments", "srt", "text", "body",
}


def is_bot_user_agent(user_agent: Optional[str]) -> bool:
    """Checks whether the user-agent header indicates a bot, crawler, or automated script."""
    if not user_agent:
        return False
    ua = user_agent.lower()
    return any(pattern in ua for pattern in BOT_PATTERNS)


def sanitize_metadata(metadata: Optional[Dict[str, Any]]) -> Optional[str]:
    """
    Sanitizes event metadata dictionary.
    Guarantees no sensitive data (passwords, tokens, transcript text) is ever stored.
    """
    if not metadata or not isinstance(metadata, dict):
        return None

    clean = {}
    for k, v in metadata.items():
        k_str = str(k).lower().strip()
        if any(sens in k_str for sens in SENSITIVE_KEYS):
            continue
        # Limit key and value length
        if len(str(k)) > 64:
            continue
        v_str = str(v)
        if len(v_str) > 512:
            clean[k] = v_str[:512] + "..."
        else:
            clean[k] = v

    return json.dumps(clean) if clean else None


def derive_browser(user_agent: Optional[str]) -> str:
    """Derives browser family from User-Agent string."""
    if not user_agent:
        return "Unknown"
    ua = user_agent.lower()
    if "edg" in ua:
        return "Edge"
    if "chrome" in ua and "safari" in ua and "edg" not in ua:
        return "Chrome"
    if "firefox" in ua:
        return "Firefox"
    if "safari" in ua and "chrome" not in ua:
        return "Safari"
    if "opera" in ua or "opr" in ua:
        return "Opera"
    return "Other"


def derive_os(user_agent: Optional[str]) -> str:
    """Derives operating system from User-Agent string."""
    if not user_agent:
        return "Unknown"
    ua = user_agent.lower()
    if "windows" in ua:
        return "Windows"
    if "macintosh" in ua or "mac os" in ua:
        return "macOS"
    if "android" in ua:
        return "Android"
    if "iphone" in ua or "ipad" in ua or "ios" in ua:
        return "iOS"
    if "linux" in ua:
        return "Linux"
    return "Other"


def record_event(
    db: Session,
    event_type: str,
    visitor_id: str,
    session_id: str,
    user_id: Optional[str] = None,
    page_path: Optional[str] = None,
    referrer_domain: Optional[str] = None,
    device_type: Optional[str] = None,
    browser: Optional[str] = None,
    os_name: Optional[str] = None,
    duration_ms: Optional[int] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Optional[AnalyticsEvent]:
    """Records a single validated analytics event."""
    try:
        # Sanitize strings
        clean_path = (page_path or "").strip()[:512] or None
        clean_ref = (referrer_domain or "").strip()[:255] or None
        clean_device = (device_type or "desktop").strip().lower()[:32]
        if clean_device not in ("desktop", "mobile", "tablet"):
            clean_device = "desktop"

        sanitized_json = sanitize_metadata(metadata)

        event = AnalyticsEvent(
            visitor_id=visitor_id[:64],
            session_id=session_id[:64],
            user_id=user_id,
            event_type=event_type[:64],
            page_path=clean_path,
            referrer_domain=clean_ref,
            device_type=clean_device,
            browser=(browser or "Unknown")[:32],
            os=(os_name or "Unknown")[:32],
            duration_ms=duration_ms,
            metadata_json=sanitized_json,
            created_at=get_utc_now(),
        )
        db.add(event)
        db.commit()
        return event
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to record analytics event: {e}")
        return None


def record_admin_audit(
    db: Session,
    admin_id: str,
    admin_email: str,
    action: str,
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
) -> Optional[AdminAuditLog]:
    """Records an administrative audit log entry."""
    try:
        sanitized_json = sanitize_metadata(details)
        log = AdminAuditLog(
            admin_id=admin_id,
            admin_email=admin_email,
            action=action[:64],
            target_type=target_type[:64] if target_type else None,
            target_id=target_id[:64] if target_id else None,
            details_json=sanitized_json,
            ip_address=ip_address[:45] if ip_address else None,
            created_at=get_utc_now(),
        )
        db.add(log)
        db.commit()
        return log
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to record admin audit log: {e}")
        return None


def compute_date_range(
    range_key: str = "7d",
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
) -> Tuple[datetime, datetime, datetime, datetime]:
    """
    Returns (start_date, end_date, prev_start_date, prev_end_date) in UTC.
    Supports: today, yesterday, 7d, 30d, 90d, custom.
    """
    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)

    if range_key == "today":
        start = today_start
        end = now
        duration = end - start
        prev_end = start
        prev_start = prev_end - duration
    elif range_key == "yesterday":
        start = today_start - timedelta(days=1)
        end = today_start
        prev_end = start
        prev_start = start - timedelta(days=1)
    elif range_key == "30d":
        start = today_start - timedelta(days=29)
        end = now
        prev_end = start
        prev_start = start - timedelta(days=30)
    elif range_key == "90d":
        start = today_start - timedelta(days=89)
        end = now
        prev_end = start
        prev_start = start - timedelta(days=90)
    elif range_key == "custom" and from_date and to_date:
        try:
            start = datetime.fromisoformat(from_date.replace("Z", "+00:00"))
            if start.tzinfo is None:
                start = start.replace(tzinfo=timezone.utc)
            end = datetime.fromisoformat(to_date.replace("Z", "+00:00"))
            if end.tzinfo is None:
                end = end.replace(tzinfo=timezone.utc)
            duration = max(timedelta(days=1), end - start)
            prev_end = start
            prev_start = start - duration
        except Exception:
            start = today_start - timedelta(days=6)
            end = now
            prev_end = start
            prev_start = start - timedelta(days=7)
    else:  # Default "7d"
        start = today_start - timedelta(days=6)
        end = now
        prev_end = start
        prev_start = start - timedelta(days=7)

    return start, end, prev_start, prev_end


def calculate_delta(current: float, previous: float) -> float:
    """Calculates percentage change between current and previous period."""
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return round(((current - previous) / previous) * 100.0, 1)


def get_dashboard_overview(
    db: Session,
    range_key: str = "7d",
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
) -> Dict[str, Any]:
    """Generates complete aggregated analytics overview and KPI metrics."""
    start, end, prev_start, prev_end = compute_date_range(range_key, from_date, to_date)

    # 1. Total Registered Users (All-time trusted application count)
    total_users_count = db.query(func.count(User.id)).scalar() or 0

    # 2. Current Period KPIs
    # Unique visitors
    cur_visitors = (
        db.query(func.count(func.distinct(AnalyticsEvent.visitor_id)))
        .filter(
            AnalyticsEvent.created_at >= start,
            AnalyticsEvent.created_at <= end,
            AnalyticsEvent.event_type == "page_view",
        )
        .scalar()
        or 0
    )

    # Total Sessions
    cur_sessions = (
        db.query(func.count(func.distinct(AnalyticsEvent.session_id)))
        .filter(
            AnalyticsEvent.created_at >= start,
            AnalyticsEvent.created_at <= end,
        )
        .scalar()
        or 0
    )

    # Page Views
    cur_page_views = (
        db.query(func.count(AnalyticsEvent.id))
        .filter(
            AnalyticsEvent.created_at >= start,
            AnalyticsEvent.created_at <= end,
            AnalyticsEvent.event_type == "page_view",
        )
        .scalar()
        or 0
    )

    # New registered users in period
    cur_new_users = (
        db.query(func.count(User.id))
        .filter(User.created_at >= start, User.created_at <= end)
        .scalar()
        or 0
    )

    # Active users in period (signed-in accounts active)
    cur_active_users = (
        db.query(func.count(func.distinct(AnalyticsEvent.user_id)))
        .filter(
            AnalyticsEvent.created_at >= start,
            AnalyticsEvent.created_at <= end,
            AnalyticsEvent.user_id.isnot(None),
        )
        .scalar()
        or 0
    )

    # Books created in period
    cur_books = (
        db.query(func.count(Book.id))
        .filter(Book.created_at >= start, Book.created_at <= end)
        .scalar()
        or 0
    )

    # Transcript imports success
    cur_imports_success = (
        db.query(func.count(AnalyticsEvent.id))
        .filter(
            AnalyticsEvent.created_at >= start,
            AnalyticsEvent.created_at <= end,
            AnalyticsEvent.event_type == "import_success",
        )
        .scalar()
        or 0
    )
    # If events were not logged yet, use books created as trusted lower bound
    cur_imports_success = max(cur_imports_success, cur_books)

    # Transcript imports failed
    cur_imports_failed = (
        db.query(func.count(AnalyticsEvent.id))
        .filter(
            AnalyticsEvent.created_at >= start,
            AnalyticsEvent.created_at <= end,
            AnalyticsEvent.event_type == "import_failed",
        )
        .scalar()
        or 0
    )

    total_import_attempts = cur_imports_success + cur_imports_failed
    cur_success_rate = (
        round((cur_imports_success / total_import_attempts) * 100.0, 1)
        if total_import_attempts > 0
        else 100.0
    )

    # Reading metrics (Current period)
    cur_reading_seconds = (
        db.query(func.coalesce(func.sum(ReadingSession.duration_seconds), 0))
        .filter(ReadingSession.start_time >= start, ReadingSession.start_time <= end)
        .scalar()
        or 0
    )
    cur_reading_sessions = (
        db.query(func.count(ReadingSession.id))
        .filter(ReadingSession.start_time >= start, ReadingSession.start_time <= end)
        .scalar()
        or 0
    )
    cur_active_readers = (
        db.query(func.count(func.distinct(ReadingSession.user_id)))
        .filter(ReadingSession.start_time >= start, ReadingSession.start_time <= end)
        .scalar()
        or 0
    )
    cur_avg_reading_seconds = (
        round(cur_reading_seconds / cur_active_readers, 1)
        if cur_active_readers > 0
        else 0.0
    )

    # Vocabulary metrics
    total_vocab_saved = db.query(func.count(UserSavedWord.id)).scalar() or 0
    cur_vocab_saved = (
        db.query(func.count(UserSavedWord.id))
        .filter(UserSavedWord.created_at >= start, UserSavedWord.created_at <= end)
        .scalar()
        or 0
    )
    vocab_learning_count = (
        db.query(func.count(UserSavedWord.id))
        .filter(UserSavedWord.learning_status == "learning")
        .scalar()
        or 0
    )
    vocab_learned_count = (
        db.query(func.count(UserSavedWord.id))
        .filter(UserSavedWord.learning_status == "learned")
        .scalar()
        or 0
    )
    vocab_new_count = (
        db.query(func.count(UserSavedWord.id))
        .filter(UserSavedWord.learning_status == "new")
        .scalar()
        or 0
    )

    # DAU / WAU / MAU metrics
    now_utc = datetime.now(timezone.utc)
    t_1d = now_utc - timedelta(days=1)
    t_7d = now_utc - timedelta(days=7)
    t_30d = now_utc - timedelta(days=30)

    dau_events = db.query(AnalyticsEvent.user_id).filter(AnalyticsEvent.created_at >= t_1d, AnalyticsEvent.user_id.isnot(None))
    dau_reads = db.query(ReadingSession.user_id).filter(ReadingSession.start_time >= t_1d)
    dau_users = dau_events.union(dau_reads).count()

    wau_events = db.query(AnalyticsEvent.user_id).filter(AnalyticsEvent.created_at >= t_7d, AnalyticsEvent.user_id.isnot(None))
    wau_reads = db.query(ReadingSession.user_id).filter(ReadingSession.start_time >= t_7d)
    wau_users = wau_events.union(wau_reads).count()

    mau_events = db.query(AnalyticsEvent.user_id).filter(AnalyticsEvent.created_at >= t_30d, AnalyticsEvent.user_id.isnot(None))
    mau_reads = db.query(ReadingSession.user_id).filter(ReadingSession.start_time >= t_30d)
    mau_users = mau_events.union(mau_reads).count()

    dau_visitors = (
        db.query(func.count(func.distinct(AnalyticsEvent.visitor_id)))
        .filter(AnalyticsEvent.created_at >= t_1d, AnalyticsEvent.event_type == "page_view")
        .scalar()
        or 0
    )
    wau_visitors = (
        db.query(func.count(func.distinct(AnalyticsEvent.visitor_id)))
        .filter(AnalyticsEvent.created_at >= t_7d, AnalyticsEvent.event_type == "page_view")
        .scalar()
        or 0
    )
    mau_visitors = (
        db.query(func.count(func.distinct(AnalyticsEvent.visitor_id)))
        .filter(AnalyticsEvent.created_at >= t_30d, AnalyticsEvent.event_type == "page_view")
        .scalar()
        or 0
    )

    stickiness_ratio = round((dau_users / mau_users) * 100.0, 1) if mau_users > 0 else 0.0

    # 3. Previous Period KPIs (for comparison)
    prev_visitors = (
        db.query(func.count(func.distinct(AnalyticsEvent.visitor_id)))
        .filter(
            AnalyticsEvent.created_at >= prev_start,
            AnalyticsEvent.created_at < start,
            AnalyticsEvent.event_type == "page_view",
        )
        .scalar()
        or 0
    )
    prev_sessions = (
        db.query(func.count(func.distinct(AnalyticsEvent.session_id)))
        .filter(
            AnalyticsEvent.created_at >= prev_start,
            AnalyticsEvent.created_at < start,
        )
        .scalar()
        or 0
    )
    prev_page_views = (
        db.query(func.count(AnalyticsEvent.id))
        .filter(
            AnalyticsEvent.created_at >= prev_start,
            AnalyticsEvent.created_at < start,
            AnalyticsEvent.event_type == "page_view",
        )
        .scalar()
        or 0
    )
    prev_new_users = (
        db.query(func.count(User.id))
        .filter(User.created_at >= prev_start, User.created_at < start)
        .scalar()
        or 0
    )
    prev_books = (
        db.query(func.count(Book.id))
        .filter(Book.created_at >= prev_start, Book.created_at < start)
        .scalar()
        or 0
    )
    prev_reading_seconds = (
        db.query(func.coalesce(func.sum(ReadingSession.duration_seconds), 0))
        .filter(ReadingSession.start_time >= prev_start, ReadingSession.start_time < start)
        .scalar()
        or 0
    )
    prev_reading_sessions = (
        db.query(func.count(ReadingSession.id))
        .filter(ReadingSession.start_time >= prev_start, ReadingSession.start_time < start)
        .scalar()
        or 0
    )
    prev_vocab_saved = (
        db.query(func.count(UserSavedWord.id))
        .filter(UserSavedWord.created_at >= prev_start, UserSavedWord.created_at < start)
        .scalar()
        or 0
    )

    # 4. Generate daily time-series chart data points
    time_series = []
    # Calculate days in range
    day_count = max(1, (end.date() - start.date()).days + 1)
    for i in range(day_count):
        day_date = start.date() + timedelta(days=i)
        day_start = datetime(day_date.year, day_date.month, day_date.day, tzinfo=timezone.utc)
        day_end = day_start + timedelta(days=1)

        d_visitors = (
            db.query(func.count(func.distinct(AnalyticsEvent.visitor_id)))
            .filter(
                AnalyticsEvent.created_at >= day_start,
                AnalyticsEvent.created_at < day_end,
                AnalyticsEvent.event_type == "page_view",
            )
            .scalar()
            or 0
        )
        d_sessions = (
            db.query(func.count(func.distinct(AnalyticsEvent.session_id)))
            .filter(
                AnalyticsEvent.created_at >= day_start,
                AnalyticsEvent.created_at < day_end,
            )
            .scalar()
            or 0
        )
        d_page_views = (
            db.query(func.count(AnalyticsEvent.id))
            .filter(
                AnalyticsEvent.created_at >= day_start,
                AnalyticsEvent.created_at < day_end,
                AnalyticsEvent.event_type == "page_view",
            )
            .scalar()
            or 0
        )
        d_new_users = (
            db.query(func.count(User.id))
            .filter(User.created_at >= day_start, User.created_at < day_end)
            .scalar()
            or 0
        )
        d_books = (
            db.query(func.count(Book.id))
            .filter(Book.created_at >= day_start, Book.created_at < day_end)
            .scalar()
            or 0
        )
        d_imports_success = (
            db.query(func.count(AnalyticsEvent.id))
            .filter(
                AnalyticsEvent.created_at >= day_start,
                AnalyticsEvent.created_at < day_end,
                AnalyticsEvent.event_type == "import_success",
            )
            .scalar()
            or 0
        )
        d_imports_success = max(d_imports_success, d_books)

        d_imports_failed = (
            db.query(func.count(AnalyticsEvent.id))
            .filter(
                AnalyticsEvent.created_at >= day_start,
                AnalyticsEvent.created_at < day_end,
                AnalyticsEvent.event_type == "import_failed",
            )
            .scalar()
            or 0
        )

        d_reading_seconds = (
            db.query(func.coalesce(func.sum(ReadingSession.duration_seconds), 0))
            .filter(ReadingSession.start_time >= day_start, ReadingSession.start_time < day_end)
            .scalar()
            or 0
        )
        d_reading_sessions = (
            db.query(func.count(ReadingSession.id))
            .filter(ReadingSession.start_time >= day_start, ReadingSession.start_time < day_end)
            .scalar()
            or 0
        )
        d_vocab_saved = (
            db.query(func.count(UserSavedWord.id))
            .filter(UserSavedWord.created_at >= day_start, UserSavedWord.created_at < day_end)
            .scalar()
            or 0
        )

        time_series.append({
            "date": day_date.isoformat(),
            "unique_visitors": d_visitors,
            "sessions": d_sessions,
            "page_views": d_page_views,
            "new_users": d_new_users,
            "books_created": d_books,
            "imports_success": d_imports_success,
            "imports_failed": d_imports_failed,
            "reading_seconds": d_reading_seconds,
            "reading_sessions": d_reading_sessions,
            "vocab_saved": d_vocab_saved,
        })

    # 5. Top landing pages
    top_pages_query = (
        db.query(AnalyticsEvent.page_path, func.count(AnalyticsEvent.id).label("views"))
        .filter(
            AnalyticsEvent.created_at >= start,
            AnalyticsEvent.created_at <= end,
            AnalyticsEvent.event_type == "page_view",
            AnalyticsEvent.page_path.isnot(None),
        )
        .group_by(AnalyticsEvent.page_path)
        .order_by(desc("views"))
        .limit(10)
        .all()
    )
    top_pages = [{"path": row[0], "views": row[1]} for row in top_pages_query]

    # 6. Top Referrers
    top_referrers_query = (
        db.query(AnalyticsEvent.referrer_domain, func.count(AnalyticsEvent.id).label("count"))
        .filter(
            AnalyticsEvent.created_at >= start,
            AnalyticsEvent.created_at <= end,
            AnalyticsEvent.referrer_domain.isnot(None),
        )
        .group_by(AnalyticsEvent.referrer_domain)
        .order_by(desc("count"))
        .limit(8)
        .all()
    )
    top_referrers = [{"domain": row[0], "count": row[1]} for row in top_referrers_query]

    # 7. Device & Browser breakdown
    devices_query = (
        db.query(AnalyticsEvent.device_type, func.count(AnalyticsEvent.id).label("count"))
        .filter(AnalyticsEvent.created_at >= start, AnalyticsEvent.created_at <= end)
        .group_by(AnalyticsEvent.device_type)
        .all()
    )
    device_breakdown = [{"type": row[0] or "desktop", "count": row[1]} for row in devices_query]

    browsers_query = (
        db.query(AnalyticsEvent.browser, func.count(AnalyticsEvent.id).label("count"))
        .filter(AnalyticsEvent.created_at >= start, AnalyticsEvent.created_at <= end)
        .group_by(AnalyticsEvent.browser)
        .order_by(desc("count"))
        .limit(6)
        .all()
    )
    browser_breakdown = [{"browser": row[0] or "Unknown", "count": row[1]} for row in browsers_query]

    # 8. Most read books in range
    top_books_query = (
        db.query(
            ReadingSession.book_id,
            Book.title,
            Book.channel_title,
            func.coalesce(func.sum(ReadingSession.duration_seconds), 0).label("total_seconds"),
            func.count(ReadingSession.id).label("sessions_count"),
            func.count(func.distinct(ReadingSession.user_id)).label("unique_readers"),
        )
        .join(Book, Book.id == ReadingSession.book_id)
        .filter(ReadingSession.start_time >= start, ReadingSession.start_time <= end)
        .group_by(ReadingSession.book_id, Book.title, Book.channel_title)
        .order_by(desc("total_seconds"))
        .limit(10)
        .all()
    )
    top_books = [
        {
            "book_id": row[0],
            "title": row[1],
            "channel_title": row[2] or "Transcriptly",
            "total_seconds": int(row[3]),
            "sessions_count": int(row[4]),
            "unique_readers": int(row[5]),
        }
        for row in top_books_query
    ]

    # 9. Top Readers in range
    top_readers_query = (
        db.query(
            ReadingSession.user_id,
            User.full_name,
            User.email,
            func.coalesce(func.sum(ReadingSession.duration_seconds), 0).label("total_seconds"),
            func.count(ReadingSession.id).label("sessions_count"),
        )
        .join(User, User.id == ReadingSession.user_id)
        .filter(ReadingSession.start_time >= start, ReadingSession.start_time <= end)
        .group_by(ReadingSession.user_id, User.full_name, User.email)
        .order_by(desc("total_seconds"))
        .limit(10)
        .all()
    )
    top_readers = [
        {
            "user_id": row[0],
            "full_name": row[1],
            "email": row[2],
            "total_seconds": int(row[3]),
            "sessions_count": int(row[4]),
        }
        for row in top_readers_query
    ]

    # 10. Top Vocabulary Learners (All-time)
    top_learners_query = (
        db.query(
            UserSavedWord.user_id,
            User.full_name,
            User.email,
            func.count(UserSavedWord.id).label("vocab_count"),
        )
        .join(User, User.id == UserSavedWord.user_id)
        .group_by(UserSavedWord.user_id, User.full_name, User.email)
        .order_by(desc("vocab_count"))
        .limit(10)
        .all()
    )
    top_learners = [
        {
            "user_id": row[0],
            "full_name": row[1],
            "email": row[2],
            "vocab_count": int(row[3]),
        }
        for row in top_learners_query
    ]

    return {
        "range": range_key,
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "kpis": {
            "unique_visitors": {
                "value": cur_visitors,
                "previous": prev_visitors,
                "delta_pct": calculate_delta(cur_visitors, prev_visitors),
                "label": "Unique Visitors",
                "description": "Distinct pseudonymous first-party visitor IDs measured during this date range.",
            },
            "sessions": {
                "value": cur_sessions,
                "previous": prev_sessions,
                "delta_pct": calculate_delta(cur_sessions, prev_sessions),
                "label": "Total Sessions",
                "description": "Visitor activity sessions separated by a 30-minute inactivity timeout.",
            },
            "page_views": {
                "value": cur_page_views,
                "previous": prev_page_views,
                "delta_pct": calculate_delta(cur_page_views, prev_page_views),
                "label": "Page Views",
                "description": "Total legitimate non-bot page view events, including repeat views.",
            },
            "new_users": {
                "value": cur_new_users,
                "previous": prev_new_users,
                "delta_pct": calculate_delta(cur_new_users, prev_new_users),
                "label": "New Registrations",
                "description": "New user accounts registered in this period.",
            },
            "total_users": {
                "value": total_users_count,
                "label": "Total Registered Users",
                "description": "All registered accounts in the application database.",
            },
            "active_users": {
                "value": cur_active_users,
                "label": "Active Users",
                "description": "Logged-in users performing actions or viewing pages in this period.",
            },
            "books_created": {
                "value": cur_books,
                "previous": prev_books,
                "delta_pct": calculate_delta(cur_books, prev_books),
                "label": "Books Created",
                "description": "Digital transcript books saved to user libraries.",
            },
            "imports_success": {
                "value": cur_imports_success,
                "label": "Successful Imports",
                "description": "Transcripts successfully staged or saved as books.",
            },
            "import_success_rate": {
                "value": cur_success_rate,
                "label": "Import Success Rate (%)",
                "description": "Percentage of successful transcript imports over all attempts.",
            },
            "reading_time_seconds": {
                "value": cur_reading_seconds,
                "previous": prev_reading_seconds,
                "delta_pct": calculate_delta(cur_reading_seconds, prev_reading_seconds),
                "label": "Total Reading Time",
                "description": "Cumulative active time users spent reading digital transcript books.",
            },
            "reading_sessions": {
                "value": cur_reading_sessions,
                "previous": prev_reading_sessions,
                "delta_pct": calculate_delta(cur_reading_sessions, prev_reading_sessions),
                "label": "Reading Sessions",
                "description": "Total reader sessions started and maintained with verified active heartbeats.",
            },
            "active_readers": {
                "value": cur_active_readers,
                "label": "Active Readers",
                "description": "Distinct users who read books during this period.",
            },
            "avg_reading_time_seconds": {
                "value": cur_avg_reading_seconds,
                "label": "Avg Time per Reader",
                "description": "Average reading duration per active reader.",
            },
            "total_vocab_saved": {
                "value": total_vocab_saved,
                "label": "Total Words Saved",
                "description": "All-time English-Bangla vocabulary entries saved to user dictionaries.",
            },
            "vocab_saved_in_range": {
                "value": cur_vocab_saved,
                "previous": prev_vocab_saved,
                "delta_pct": calculate_delta(cur_vocab_saved, prev_vocab_saved),
                "label": "Words Saved (Period)",
                "description": "Vocabulary saved by readers during this date range.",
            },
        },
        "user_engagement": {
            "dau_users": dau_users,
            "wau_users": wau_users,
            "mau_users": mau_users,
            "dau_visitors": dau_visitors,
            "wau_visitors": wau_visitors,
            "mau_visitors": mau_visitors,
            "stickiness_ratio": stickiness_ratio,
        },
        "vocabulary_metrics": {
            "total_saved": total_vocab_saved,
            "added_in_range": cur_vocab_saved,
            "by_status": {
                "new": vocab_new_count,
                "learning": vocab_learning_count,
                "learned": vocab_learned_count,
            },
        },
        "top_books": top_books,
        "top_readers": top_readers,
        "top_learners": top_learners,
        "time_series": time_series,
        "top_pages": top_pages,
        "top_referrers": top_referrers,
        "device_breakdown": device_breakdown,
        "browser_breakdown": browser_breakdown,
    }


def get_users_list(
    db: Session,
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    role_filter: Optional[str] = None,
) -> Dict[str, Any]:
    """Retrieves paginated, searchable user management listing with reading and vocabulary statistics."""
    page = max(1, page)
    limit = max(1, min(100, limit))
    offset = (page - 1) * limit

    query = db.query(User)

    if search:
        s = f"%{search.strip().lower()}%"
        query = query.filter((func.lower(User.email).like(s)) | (func.lower(User.full_name).like(s)))

    if status_filter == "active":
        query = query.filter(User.is_active.is_(True))
    elif status_filter == "suspended":
        query = query.filter(User.is_active.is_(False))

    if role_filter == "admin":
        query = query.filter((User.is_admin.is_(True)) | (User.role == "admin"))
    elif role_filter == "user":
        query = query.filter((User.is_admin.is_(False)) & (User.role != "admin"))

    total_count = query.count()
    users = query.order_by(desc(User.created_at)).offset(offset).limit(limit).all()

    user_ids = [u.id for u in users]
    book_counts_map = {}
    reading_stats_map = {}
    vocab_stats_map = {}
    latest_book_map = {}

    if user_ids:
        # 1. Book counts
        book_counts = (
            db.query(Book.user_id, func.count(Book.id))
            .filter(Book.user_id.in_(user_ids))
            .group_by(Book.user_id)
            .all()
        )
        book_counts_map = {row[0]: row[1] for row in book_counts}

        # 2. Reading stats (avoid N+1)
        now_utc = datetime.now(timezone.utc)
        today_start = datetime(now_utc.year, now_utc.month, now_utc.day, tzinfo=timezone.utc)
        d7_start = today_start - timedelta(days=6)
        d30_start = today_start - timedelta(days=29)

        reading_stats = (
            db.query(
                ReadingSession.user_id,
                func.coalesce(func.sum(ReadingSession.duration_seconds), 0).label("total_seconds"),
                func.coalesce(
                    func.sum(
                        case((ReadingSession.start_time >= today_start, ReadingSession.duration_seconds), else_=0)
                    ),
                    0,
                ).label("today_seconds"),
                func.coalesce(
                    func.sum(
                        case((ReadingSession.start_time >= d7_start, ReadingSession.duration_seconds), else_=0)
                    ),
                    0,
                ).label("d7_seconds"),
                func.coalesce(
                    func.sum(
                        case((ReadingSession.start_time >= d30_start, ReadingSession.duration_seconds), else_=0)
                    ),
                    0,
                ).label("d30_seconds"),
                func.count(ReadingSession.id).label("sessions_count"),
                func.count(func.distinct(ReadingSession.book_id)).label("distinct_books_read"),
            )
            .filter(ReadingSession.user_id.in_(user_ids))
            .group_by(ReadingSession.user_id)
            .all()
        )
        for row in reading_stats:
            reading_stats_map[row[0]] = {
                "total_seconds": int(row[1]),
                "today_seconds": int(row[2]),
                "d7_seconds": int(row[3]),
                "d30_seconds": int(row[4]),
                "sessions_count": int(row[5]),
                "distinct_books_read": int(row[6]),
            }

        # 3. Vocabulary stats (avoid N+1)
        vocab_stats = (
            db.query(
                UserSavedWord.user_id,
                func.count(UserSavedWord.id).label("total_words"),
                func.coalesce(
                    func.sum(case((UserSavedWord.created_at >= today_start, 1), else_=0)),
                    0,
                ).label("today_words"),
                func.coalesce(
                    func.sum(case((UserSavedWord.created_at >= d30_start, 1), else_=0)),
                    0,
                ).label("d30_words"),
                func.coalesce(
                    func.sum(case((UserSavedWord.learning_status == "learned", 1), else_=0)),
                    0,
                ).label("learned_words"),
            )
            .filter(UserSavedWord.user_id.in_(user_ids))
            .group_by(UserSavedWord.user_id)
            .all()
        )
        for row in vocab_stats:
            vocab_stats_map[row[0]] = {
                "total_words": int(row[1]),
                "today_words": int(row[2]),
                "d30_words": int(row[3]),
                "learned_words": int(row[4]),
            }

        # 4. Most recent book title read or created
        latest_sessions = (
            db.query(ReadingSession.user_id, Book.title, ReadingSession.start_time)
            .join(Book, Book.id == ReadingSession.book_id)
            .filter(ReadingSession.user_id.in_(user_ids))
            .order_by(desc(ReadingSession.start_time))
            .all()
        )
        for uid, btitle, _ in latest_sessions:
            if uid not in latest_book_map:
                latest_book_map[uid] = btitle

        latest_created_books = (
            db.query(Book.user_id, Book.title)
            .filter(Book.user_id.in_(user_ids))
            .order_by(desc(Book.created_at))
            .all()
        )
        for uid, btitle in latest_created_books:
            if uid not in latest_book_map:
                latest_book_map[uid] = btitle

    items = []
    for u in users:
        r_stat = reading_stats_map.get(u.id, {})
        v_stat = vocab_stats_map.get(u.id, {})
        items.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "is_active": u.is_active,
            "role": u.role,
            "is_admin": u.is_admin or (u.role == "admin"),
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None,
            "books_count": book_counts_map.get(u.id, 0),
            "reading_time_seconds": r_stat.get("total_seconds", 0),
            "reading_time_today_seconds": r_stat.get("today_seconds", 0),
            "reading_time_7d_seconds": r_stat.get("d7_seconds", 0),
            "reading_time_30d_seconds": r_stat.get("d30_seconds", 0),
            "reading_sessions_count": r_stat.get("sessions_count", 0),
            "distinct_books_read": r_stat.get("distinct_books_read", 0),
            "vocab_saved_total": v_stat.get("total_words", 0),
            "vocab_saved_today": v_stat.get("today_words", 0),
            "vocab_saved_30d": v_stat.get("d30_words", 0),
            "vocab_learned": v_stat.get("learned_words", 0),
            "last_read_book_title": latest_book_map.get(u.id, "None yet"),
        })

    return {
        "items": items,
        "total_count": total_count,
        "page": page,
        "limit": limit,
        "total_pages": max(1, (total_count + limit - 1) // limit),
    }


def get_user_activity_detail(db: Session, user_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves full activity profile, reading history, vocabulary progress, and books for a single user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None

    # 1. Reading summary
    total_reading_seconds = (
        db.query(func.coalesce(func.sum(ReadingSession.duration_seconds), 0))
        .filter(ReadingSession.user_id == user_id)
        .scalar()
        or 0
    )
    total_reading_sessions = (
        db.query(func.count(ReadingSession.id))
        .filter(ReadingSession.user_id == user_id)
        .scalar()
        or 0
    )
    distinct_books_read = (
        db.query(func.count(func.distinct(ReadingSession.book_id)))
        .filter(ReadingSession.user_id == user_id)
        .scalar()
        or 0
    )
    avg_session_seconds = (
        round(total_reading_seconds / total_reading_sessions, 1)
        if total_reading_sessions > 0
        else 0.0
    )

    now_utc = datetime.now(timezone.utc)
    today_start = datetime(now_utc.year, now_utc.month, now_utc.day, tzinfo=timezone.utc)
    d7_start = today_start - timedelta(days=6)
    d30_start = today_start - timedelta(days=29)

    today_reading_seconds = (
        db.query(func.coalesce(func.sum(ReadingSession.duration_seconds), 0))
        .filter(ReadingSession.user_id == user_id, ReadingSession.start_time >= today_start)
        .scalar()
        or 0
    )
    d7_reading_seconds = (
        db.query(func.coalesce(func.sum(ReadingSession.duration_seconds), 0))
        .filter(ReadingSession.user_id == user_id, ReadingSession.start_time >= d7_start)
        .scalar()
        or 0
    )
    d30_reading_seconds = (
        db.query(func.coalesce(func.sum(ReadingSession.duration_seconds), 0))
        .filter(ReadingSession.user_id == user_id, ReadingSession.start_time >= d30_start)
        .scalar()
        or 0
    )

    # 2. Reading sessions (most recent 25)
    recent_sessions_query = (
        db.query(
            ReadingSession.id,
            ReadingSession.session_id,
            ReadingSession.book_id,
            Book.title,
            ReadingSession.start_time,
            ReadingSession.end_time,
            ReadingSession.duration_seconds,
            ReadingSession.reading_progress,
            ReadingSession.last_page_read,
            ReadingSession.device_type,
        )
        .join(Book, Book.id == ReadingSession.book_id)
        .filter(ReadingSession.user_id == user_id)
        .order_by(desc(ReadingSession.start_time))
        .limit(25)
        .all()
    )
    recent_sessions = [
        {
            "id": row[0],
            "session_id": row[1],
            "book_id": row[2],
            "book_title": row[3],
            "start_time": row[4].isoformat() if row[4] else None,
            "end_time": row[5].isoformat() if row[5] else None,
            "duration_seconds": row[6],
            "reading_progress": round(row[7] * 100.0, 1),
            "last_page_read": row[8],
            "device_type": row[9] or "desktop",
        }
        for row in recent_sessions_query
    ]

    # 3. Vocabulary summary & recent words
    total_vocab = db.query(func.count(UserSavedWord.id)).filter(UserSavedWord.user_id == user_id).scalar() or 0
    vocab_new = db.query(func.count(UserSavedWord.id)).filter(UserSavedWord.user_id == user_id, UserSavedWord.learning_status == "new").scalar() or 0
    vocab_learning = db.query(func.count(UserSavedWord.id)).filter(UserSavedWord.user_id == user_id, UserSavedWord.learning_status == "learning").scalar() or 0
    vocab_learned = db.query(func.count(UserSavedWord.id)).filter(UserSavedWord.user_id == user_id, UserSavedWord.learning_status == "learned").scalar() or 0

    recent_words_query = (
        db.query(UserSavedWord)
        .filter(UserSavedWord.user_id == user_id)
        .order_by(desc(UserSavedWord.created_at))
        .limit(25)
        .all()
    )
    recent_words = [
        {
            "id": w.id,
            "original_word": w.original_word,
            "normalized_word": w.normalized_word,
            "bangla_meaning": w.bangla_meaning,
            "english_definition": w.english_definition,
            "pronunciation": w.pronunciation,
            "learning_status": w.learning_status,
            "source_book_title": w.source_book_title,
            "notes": w.notes,
            "created_at": w.created_at.isoformat() if w.created_at else None,
        }
        for w in recent_words_query
    ]

    # 4. User's Books
    user_books_query = (
        db.query(Book)
        .filter(Book.user_id == user_id)
        .order_by(desc(Book.created_at))
        .limit(20)
        .all()
    )
    user_books = [
        {
            "id": b.id,
            "title": b.title,
            "channel_title": b.channel_title,
            "language_name": b.language_name,
            "word_count": b.word_count,
            "reading_progress": round(b.reading_progress * 100.0, 1),
            "last_page_read": b.last_page_read,
            "total_pages": b.total_pages,
            "created_at": b.created_at.isoformat() if b.created_at else None,
        }
        for b in user_books_query
    ]

    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_admin": user.is_admin or (user.role == "admin"),
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
        },
        "reading_summary": {
            "total_reading_seconds": total_reading_seconds,
            "today_reading_seconds": today_reading_seconds,
            "d7_reading_seconds": d7_reading_seconds,
            "d30_reading_seconds": d30_reading_seconds,
            "total_reading_sessions": total_reading_sessions,
            "distinct_books_read": distinct_books_read,
            "avg_session_seconds": avg_session_seconds,
        },
        "recent_sessions": recent_sessions,
        "vocabulary_summary": {
            "total_words": total_vocab,
            "new_count": vocab_new,
            "learning_count": vocab_learning,
            "learned_count": vocab_learned,
        },
        "recent_words": recent_words,
        "books": user_books,
    }


def get_feature_analytics(
    db: Session,
    range_key: str = "7d",
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
) -> Dict[str, Any]:
    """Generates detailed feature usage analytics for transcripts, books, and languages."""
    start, end, _, _ = compute_date_range(range_key, from_date, to_date)

    # 1. Attempts, successes, failures
    attempts = (
        db.query(func.count(AnalyticsEvent.id))
        .filter(
            AnalyticsEvent.created_at >= start,
            AnalyticsEvent.created_at <= end,
            AnalyticsEvent.event_type.in_(["import_attempt", "transcript_extracted"]),
        )
        .scalar()
        or 0
    )
    successes = (
        db.query(func.count(AnalyticsEvent.id))
        .filter(
            AnalyticsEvent.created_at >= start,
            AnalyticsEvent.created_at <= end,
            AnalyticsEvent.event_type == "import_success",
        )
        .scalar()
        or 0
    )
    failures = (
        db.query(func.count(AnalyticsEvent.id))
        .filter(
            AnalyticsEvent.created_at >= start,
            AnalyticsEvent.created_at <= end,
            AnalyticsEvent.event_type == "import_failed",
        )
        .scalar()
        or 0
    )
    books_created = (
        db.query(func.count(Book.id))
        .filter(Book.created_at >= start, Book.created_at <= end)
        .scalar()
        or 0
    )
    successes = max(successes, books_created)
    attempts = max(attempts, successes + failures)

    success_rate = round((successes / attempts) * 100.0, 1) if attempts > 0 else 100.0

    # 2. Top languages from Books created
    lang_query = (
        db.query(Book.language_name, func.count(Book.id).label("count"))
        .filter(Book.created_at >= start, Book.created_at <= end)
        .group_by(Book.language_name)
        .order_by(desc("count"))
        .limit(8)
        .all()
    )
    languages = [{"language": row[0], "count": row[1]} for row in lang_query]

    # 3. Translation vs Original ratio
    translated_count = (
        db.query(func.count(Book.id))
        .filter(Book.created_at >= start, Book.created_at <= end, Book.is_translated.is_(True))
        .scalar()
        or 0
    )
    original_count = max(0, books_created - translated_count)

    # 4. Error categories from failed events
    errors_query = (
        db.query(AnalyticsEvent.metadata_json)
        .filter(
            AnalyticsEvent.created_at >= start,
            AnalyticsEvent.created_at <= end,
            AnalyticsEvent.event_type == "import_failed",
        )
        .limit(50)
        .all()
    )
    error_categories: Dict[str, int] = {}
    for (meta_str,) in errors_query:
        if meta_str:
            try:
                m = json.loads(meta_str)
                err_code = m.get("error_code") or m.get("code") or "UNKNOWN_ERROR"
                error_categories[err_code] = error_categories.get(err_code, 0) + 1
            except Exception:
                error_categories["GENERAL_FAILURE"] = error_categories.get("GENERAL_FAILURE", 0) + 1

    error_list = [{"category": k, "count": v} for k, v in sorted(error_categories.items(), key=lambda x: -x[1])]

    return {
        "range": range_key,
        "attempts": attempts,
        "successes": successes,
        "failures": failures,
        "books_created": books_created,
        "success_rate": success_rate,
        "languages": languages,
        "translation_ratio": {
            "original": original_count,
            "translated": translated_count,
        },
        "common_errors": error_list,
    }


def get_system_health_metrics(db: Session) -> Dict[str, Any]:
    """Gathers server and database health telemetry without exposing credentials or internal paths."""
    import sys
    import os
    import platform

    # Database connectivity check & latency
    t0 = datetime.now()
    db.execute(text("SELECT 1")).scalar()
    latency_ms = round((datetime.now() - t0).total_seconds() * 1000, 2)

    total_users = db.query(func.count(User.id)).scalar() or 0
    total_books = db.query(func.count(Book.id)).scalar() or 0
    total_events = db.query(func.count(AnalyticsEvent.id)).scalar() or 0

    # Recent failure events
    recent_errors_query = (
        db.query(AnalyticsEvent)
        .filter(AnalyticsEvent.event_type == "import_failed")
        .order_by(desc(AnalyticsEvent.created_at))
        .limit(10)
        .all()
    )
    recent_errors = []
    for e in recent_errors_query:
        reason = "Import error"
        if e.metadata_json:
            try:
                m = json.loads(e.metadata_json)
                reason = m.get("detail") or m.get("error_code") or "Import error"
            except Exception:
                pass
        recent_errors.append({
            "timestamp": e.created_at.isoformat(),
            "reason": str(reason)[:120],
            "page_path": e.page_path,
        })

    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": {
            "status": "connected",
            "latency_ms": latency_ms,
            "total_users": total_users,
            "total_books": total_books,
            "total_analytics_events": total_events,
        },
        "runtime": {
            "python_version": platform.python_version(),
            "os": platform.system(),
        },
        "recent_import_failures": recent_errors,
    }
