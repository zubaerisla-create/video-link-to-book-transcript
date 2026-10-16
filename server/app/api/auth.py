import logging
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from server.app.config import settings
from server.app.db.database import get_db
from server.app.db.models import User
from server.app.schemas.auth import (
    SignupRequest,
    LoginRequest,
    ForgotPasswordRequest,
    UserResponse,
    AuthResponse,
)
from server.app.auth.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

logger = logging.getLogger("transcriptly.auth")
router = APIRouter(prefix="/auth", tags=["Authentication"])


def set_auth_cookie(response: Response, token: str):
    """Sets a secure HttpOnly cookie for session management."""
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        max_age=settings.JWT_EXPIRE_MINUTES * 60,
        path="/",
    )


def clear_auth_cookie(response: Response):
    """Clears the authentication cookie."""
    response.delete_cookie(
        key=settings.COOKIE_NAME,
        path="/",
        httponly=True,
        samesite="lax",
    )


@router.post(
    "/signup",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="User Registration",
)
def signup(
    payload: SignupRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    clean_email = payload.email.lower().strip()

    # Check if user already exists
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"detail": "An account with this email already exists.", "code": "EMAIL_EXISTS"},
        )

    # Hash password and create user
    hashed = hash_password(payload.password)
    new_user = User(
        email=clean_email,
        full_name=payload.full_name.strip(),
        hashed_password=hashed,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    logger.info("New user registered: %s (id=%s)", new_user.email, new_user.id)

    token = create_access_token(new_user.id, new_user.email)
    set_auth_cookie(response, token)

    return AuthResponse(
        user=UserResponse.model_validate(new_user),
        token=token,
        message="Account created successfully.",
    )


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="User Login",
)
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    clean_email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"detail": "Invalid email or password.", "code": "INVALID_CREDENTIALS"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"detail": "Account is disabled. Please contact support.", "code": "ACCOUNT_DISABLED"},
        )

    token = create_access_token(user.id, user.email)
    set_auth_cookie(response, token)

    logger.info("User logged in: %s (id=%s)", user.email, user.id)

    return AuthResponse(
        user=UserResponse.model_validate(user),
        token=token,
        message="Logged in successfully.",
    )


@router.post(
    "/logout",
    summary="User Logout",
)
def logout(response: Response):
    clear_auth_cookie(response)
    return {"message": "Logged out successfully."}


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get Current User Profile",
)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.post(
    "/forgot-password",
    summary="Request Password Reset",
)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    # Standard security practice: return success regardless of email existence to prevent user enumeration
    clean_email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()
    if user:
        logger.info("Password reset requested for email: %s", clean_email)
    return {
        "message": "If an account exists with this email, password reset instructions have been sent."
    }
