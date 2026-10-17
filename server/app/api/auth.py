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
    ResetPasswordRequest,
    UserResponse,
    AuthResponse,
)
from server.app.auth.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    create_password_reset_token,
    decode_password_reset_token,
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

    # Server-side analytics event for registration
    try:
        from server.app.services.analytics_service import record_event
        record_event(
            db=db,
            event_type="user_registration",
            visitor_id=new_user.id,
            session_id=new_user.id,
            user_id=new_user.id,
            page_path="/signup",
            metadata={"email": clean_email},
        )
    except Exception as e:
        logger.warning("Failed to record user_registration event: %s", e)

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

    # Track last login timestamp
    try:
        from server.app.db.models import get_utc_now
        user.last_login_at = get_utc_now()
        db.commit()
    except Exception:
        db.rollback()

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


def send_reset_email(to_email: str, reset_link: str, full_name: str):
    """Sends a password recovery email via SMTP using Gmail app credentials."""
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Reset Your Transcriptly Password"
        msg["From"] = f"Transcriptly <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = to_email

        text_content = (
            f"Hello {full_name},\n\n"
            f"We received a request to reset your Transcriptly password. Click the link below to set a new password:\n\n"
            f"{reset_link}\n\n"
            f"This link is valid for 15 minutes. If you did not make this request, you can safely ignore this email.\n\n"
            f"- The Transcriptly Team"
        )

        html_content = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #F0E8E2; border-radius: 16px; background-color: #FFFDF8;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #292522; margin: 0; font-size: 20px; font-weight: bold;">Reset Your Password</h2>
            </div>
            <p style="color: #44403C; font-size: 14px; line-height: 1.5;">Hello {full_name},</p>
            <p style="color: #77716D; font-size: 14px; line-height: 1.5;">We received a request to reset the password for your Transcriptly account. Click the button below to choose a new password:</p>
            <div style="margin: 28px 0; text-align: center;">
                <a href="{reset_link}" style="background-color: #292522; color: #ffffff; padding: 12px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #77716D; font-size: 12px; line-height: 1.5;">Or copy and paste this link into your browser:<br/><a href="{reset_link}" style="color: #292522; word-break: break-all;">{reset_link}</a></p>
            <div style="margin-top: 24px; pt: 16px; border-top: 1px solid #F0E8E2; font-size: 11px; color: #A8A29E; text-align: center;">
                This link expires in 15 minutes. If you didn't request a password reset, you can safely ignore this email.
            </div>
        </div>
        """

        msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        clean_pass = settings.SMTP_PASSWORD.replace(" ", "")

        if settings.SMTP_PORT == 465:
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                server.login(settings.SMTP_USER, clean_pass)
                server.send_message(msg)
        else:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                server.starttls()
                server.login(settings.SMTP_USER, clean_pass)
                server.send_message(msg)
        logger.info("Password reset email sent successfully to %s", to_email)
    except Exception as e:
        logger.error("Failed to send password reset email to %s: %s", to_email, e)


@router.post(
    "/forgot-password",
    summary="Request Password Reset",
)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    clean_email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()
    if user:
        token = create_password_reset_token(user.id, user.email, user.hashed_password)
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        send_reset_email(user.email, reset_link, user.full_name)
        logger.info("Password reset token generated and email dispatched for: %s", clean_email)
    return {
        "message": "If an account exists with this email, password reset instructions have been sent."
    }


@router.post(
    "/reset-password",
    summary="Complete Password Reset",
)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    import hashlib

    decoded = decode_password_reset_token(payload.token)
    if not decoded or "sub" not in decoded:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"detail": "Password reset link is invalid or has expired.", "code": "INVALID_RESET_TOKEN"},
        )

    user_id = decoded["sub"]
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "User account not found.", "code": "USER_NOT_FOUND"},
        )

    # Replay prevention: verify the current password hash matches the token fingerprint
    expected_fp = hashlib.sha256(user.hashed_password.encode("utf-8")).hexdigest()[:16]
    if decoded.get("fp") != expected_fp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"detail": "This password reset link has already been used.", "code": "RESET_TOKEN_ALREADY_USED"},
        )

    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    logger.info("Password successfully reset for user: %s (id=%s)", user.email, user.id)

    return {"message": "Password has been successfully updated. You may now log in with your new password."}
