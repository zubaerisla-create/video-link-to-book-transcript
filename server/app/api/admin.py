import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import desc

from server.app.db.database import get_db
from server.app.db.models import User, AdminAuditLog
from server.app.auth.security import get_current_admin
from server.app.services.analytics_service import (
    get_dashboard_overview,
    get_users_list,
    get_user_activity_detail,
    get_feature_analytics,
    get_system_health_metrics,
    record_admin_audit,
)

logger = logging.getLogger("transcriptly.admin.api")
router = APIRouter(prefix="/admin", tags=["Admin Portal"])


class UpdateUserStatusRequest(BaseModel):
    is_active: bool = Field(..., description="Active status of the user account")


class UpdateUserRoleRequest(BaseModel):
    role: str = Field(..., pattern="^(admin|user)$", description="Role to assign: 'admin' or 'user'")


def extract_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


@router.get(
    "/overview",
    summary="Get Main Analytics Dashboard Overview",
)
def get_overview(
    range: str = Query("7d", pattern="^(today|yesterday|7d|30d|90d|custom)$"),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """
    Returns real, date-filtered KPI cards, comparison deltas, time-series charts,
    and top referrer/page distributions.
    """
    return get_dashboard_overview(
        db=db,
        range_key=range,
        from_date=from_date,
        to_date=to_date,
    )


@router.get(
    "/users",
    summary="List Registered Users with Search and Pagination",
)
def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None, pattern="^(all|active|suspended)$"),
    role: Optional[str] = Query(None, pattern="^(all|admin|user)$"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """
    Lists users safely without exposing password hashes or tokens.
    Includes book counts, account status, and registration date.
    """
    return get_users_list(
        db=db,
        page=page,
        limit=limit,
        search=search,
        status_filter=status,
        role_filter=role,
    )


@router.get(
    "/user-activity",
    summary="List User Activities and Reading Durations",
)
def list_user_activity(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None, pattern="^(all|active|suspended)$"),
    role: Optional[str] = Query(None, pattern="^(all|admin|user)$"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """Returns paginated users with detailed reading duration and vocabulary statistics."""
    return get_users_list(
        db=db,
        page=page,
        limit=limit,
        search=search,
        status_filter=status,
        role_filter=role,
    )


@router.get(
    "/users/{user_id}/activity",
    summary="Get Full User Activity and Reading Profile",
)
def get_user_activity(
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """
    Returns reading sessions, duration aggregations, saved vocabulary progress,
    and book history for a specific user.
    """
    activity = get_user_activity_detail(db=db, user_id=user_id)
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "User not found.", "code": "USER_NOT_FOUND"},
        )
    return activity


@router.patch(
    "/users/{user_id}/status",
    summary="Suspend or Reactivate a User Account",
)
def update_user_status(
    user_id: str,
    payload: UpdateUserStatusRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """
    Safely toggles user status.
    Protects against self-suspension and deactivating the last active administrator.
    Audited in admin_audit_logs.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "User not found.", "code": "USER_NOT_FOUND"},
        )

    # Protect self-suspension
    if user.id == current_admin.id and not payload.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"detail": "You cannot deactivate your own administrative account.", "code": "SELF_DEACTIVATION_PROHIBITED"},
        )

    # Protect the last administrator from deactivation
    if (user.is_admin or user.role == "admin") and not payload.is_active:
        active_admins_count = (
            db.query(User)
            .filter(
                (User.is_admin.is_(True)) | (User.role == "admin"),
                User.is_active.is_(True),
                User.id != user.id,
            )
            .count()
        )
        if active_admins_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"detail": "Cannot deactivate the only active administrator.", "code": "LAST_ADMIN_PROTECTED"},
            )

    old_status = user.is_active
    user.is_active = payload.is_active
    db.commit()

    # Record sensitive admin action in audit log
    record_admin_audit(
        db=db,
        admin_id=current_admin.id,
        admin_email=current_admin.email,
        action="USER_STATUS_CHANGE",
        target_type="user",
        target_id=user.id,
        details={
            "target_email": user.email,
            "old_active": old_status,
            "new_active": user.is_active,
        },
        ip_address=extract_ip(request),
    )

    action_label = "activated" if user.is_active else "suspended"
    return {"message": f"User account has been {action_label}.", "is_active": user.is_active}


@router.patch(
    "/users/{user_id}/role",
    summary="Update User Role (Promote / Demote)",
)
def update_user_role(
    user_id: str,
    payload: UpdateUserRoleRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """
    Updates user administrative role.
    Prevents demoting the last active administrator.
    Audited in admin_audit_logs.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "User not found.", "code": "USER_NOT_FOUND"},
        )

    # Protect demoting oneself if last admin
    if user.id == current_admin.id and payload.role != "admin":
        active_admins_count = (
            db.query(User)
            .filter(
                (User.is_admin.is_(True)) | (User.role == "admin"),
                User.is_active.is_(True),
                User.id != user.id,
            )
            .count()
        )
        if active_admins_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"detail": "Cannot demote the only remaining administrator.", "code": "LAST_ADMIN_PROTECTED"},
            )

    old_role = user.role
    user.role = payload.role
    user.is_admin = (payload.role == "admin")
    db.commit()

    record_admin_audit(
        db=db,
        admin_id=current_admin.id,
        admin_email=current_admin.email,
        action="USER_ROLE_CHANGE",
        target_type="user",
        target_id=user.id,
        details={
            "target_email": user.email,
            "old_role": old_role,
            "new_role": user.role,
        },
        ip_address=extract_ip(request),
    )

    return {"message": f"User role updated to {user.role}.", "role": user.role, "is_admin": user.is_admin}


@router.get(
    "/feature-usage",
    summary="Transcriptly Feature Analytics",
)
def feature_usage(
    range: str = Query("7d", pattern="^(today|yesterday|7d|30d|90d|custom)$"),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """Returns transcript extraction, book creation, and language breakdown metrics."""
    return get_feature_analytics(
        db=db,
        range_key=range,
        from_date=from_date,
        to_date=to_date,
    )


@router.get(
    "/system-health",
    summary="System and Database Health Overview",
)
def system_health(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """Returns database connectivity, runtime metrics, and recent error categories."""
    return get_system_health_metrics(db=db)


@router.get(
    "/audit-logs",
    summary="List Administrative Audit Logs",
)
def list_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """Returns paginated audit logs of sensitive administrative actions."""
    page = max(1, page)
    limit = max(1, min(100, limit))
    offset = (page - 1) * limit

    query = db.query(AdminAuditLog)
    total_count = query.count()
    logs = query.order_by(desc(AdminAuditLog.created_at)).offset(offset).limit(limit).all()

    items = []
    for l in logs:
        items.append({
            "id": l.id,
            "admin_id": l.admin_id,
            "admin_email": l.admin_email,
            "action": l.action,
            "target_type": l.target_type,
            "target_id": l.target_id,
            "details": l.details_json,
            "ip_address": l.ip_address,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        })

    return {
        "items": items,
        "total_count": total_count,
        "page": page,
        "limit": limit,
        "total_pages": max(1, (total_count + limit - 1) // limit),
    }
