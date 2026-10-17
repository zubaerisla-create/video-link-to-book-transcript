from datetime import datetime
from pydantic import BaseModel, Field, model_validator, ConfigDict


class SignupRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120, description="User full name")
    email: str = Field(..., min_length=5, max_length=255, description="Valid email address")
    password: str = Field(..., min_length=8, max_length=128, description="Password (at least 8 characters)")
    confirm_password: str = Field(..., min_length=8, max_length=128, description="Confirm password")

    @model_validator(mode="after")
    def check_passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        return self


class LoginRequest(BaseModel):
    email: str = Field(..., description="Registered email address")
    password: str = Field(..., description="Account password")


class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., description="Registered email address")


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., description="Password reset token received via email")
    new_password: str = Field(..., min_length=8, max_length=128, description="New account password")
    confirm_password: str = Field(..., min_length=8, max_length=128, description="Confirm new password")

    @model_validator(mode="after")
    def check_passwords_match(self):
        if self.new_password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        return self


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    is_active: bool = True
    role: str = "user"
    is_admin: bool = False
    created_at: datetime


class AuthResponse(BaseModel):
    user: UserResponse
    token: str
    message: str
