import datetime
import hashlib
import uuid
from typing import Optional
import bcrypt
import jwt
from fastapi import Request, HTTPException, status, Depends
from sqlalchemy.orm import Session

from server.app.config import settings
from server.app.db.database import get_db
from server.app.db.models import User


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str, expires_delta: Optional[datetime.timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.datetime.now(datetime.timezone.utc) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
            minutes=settings.JWT_EXPIRE_MINUTES
        )

    payload = {
        "sub": user_id,
        "email": email,
        "exp": expire,
        "iat": datetime.datetime.now(datetime.timezone.utc),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except (jwt.PyJWTError, Exception):
        return None


def create_password_reset_token(user_id: str, email: str, password_hash: str) -> str:
    expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=15)
    # Fingerprint current password hash: as soon as password changes, token is permanently invalidated
    fp = hashlib.sha256(password_hash.encode("utf-8")).hexdigest()[:16]
    payload = {
        "sub": user_id,
        "email": email,
        "purpose": "password_reset",
        "fp": fp,
        "jti": str(uuid.uuid4()),
        "exp": expire,
        "iat": datetime.datetime.now(datetime.timezone.utc),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_password_reset_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("purpose") != "password_reset":
            return None
        return payload
    except (jwt.PyJWTError, Exception):
        return None


def get_token_from_request(request: Request) -> Optional[str]:
    # 1. First check Authorization header: Bearer <token> (explicit header takes precedence)
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header[7:].strip()

    # 2. Check HttpOnly cookie
    cookie_token = request.cookies.get(settings.COOKIE_NAME)
    if cookie_token:
        return cookie_token

    return None


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    token = get_token_from_request(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"detail": "Authentication required. Please log in.", "code": "UNAUTHENTICATED"},
        )

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"detail": "Session expired or invalid. Please log in again.", "code": "INVALID_TOKEN"},
        )

    user_id = payload["sub"]
    user = db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"detail": "User account not found or disabled.", "code": "USER_NOT_FOUND"},
        )

    return user


def get_current_user_optional(
    request: Request,
    db: Session = Depends(get_db),
) -> Optional[User]:
    token = get_token_from_request(request)
    if not token:
        return None

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        return None

    user_id = payload["sub"]
    return db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()


def get_current_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Enforces server-side administrator authorization.
    Verifies that the user has is_admin=True or role='admin'.
    Never trusts client-supplied headers or role claims.
    """
    if not (current_user.is_admin or getattr(current_user, "role", "user") == "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"detail": "Administrator access required.", "code": "FORBIDDEN"},
        )
    return current_user

