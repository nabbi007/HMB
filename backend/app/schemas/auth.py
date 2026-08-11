import uuid

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.core.security import password_error
from app.models.user import UserRole


def _check_password(v: str) -> str:
    err = password_error(v)
    if err:
        raise ValueError(err)
    return v


class SignupRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=60)
    last_name: str = Field(min_length=1, max_length=60)
    phone: str = Field(min_length=7, max_length=20)
    email: EmailStr | None = None
    password: str = Field(min_length=6, max_length=128)
    role: UserRole

    @field_validator("password")
    @classmethod
    def strong_password(cls, v: str) -> str:
        return _check_password(v)

    @field_validator("role")
    @classmethod
    def no_admin_via_signup(cls, v: UserRole) -> UserRole:
        # Admins are created only by scripts/create_admin.py — never through the public API.
        if v == UserRole.admin:
            raise ValueError("admin accounts cannot be created via signup")
        return v


class LoginRequest(BaseModel):
    identifier: str = Field(description="phone or email")
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class OtpVerifyRequest(BaseModel):
    code: str = Field(min_length=4, max_length=10)


class UserUpdate(BaseModel):
    # Note: NO email field — email is deliberately immutable via this endpoint.
    first_name: str | None = Field(default=None, min_length=1, max_length=60)
    last_name: str | None = Field(default=None, min_length=1, max_length=60)
    phone: str | None = Field(default=None, min_length=7, max_length=20)


class ForgotPasswordRequest(BaseModel):
    identifier: str = Field(description="phone or email")


class VerifyResetCodeRequest(BaseModel):
    identifier: str = Field(description="phone or email")
    code: str = Field(min_length=4, max_length=10)


class ResetPasswordRequest(BaseModel):
    identifier: str = Field(description="phone or email")
    code: str = Field(min_length=4, max_length=10)
    new_password: str = Field(min_length=6, max_length=128)

    @field_validator("new_password")
    @classmethod
    def strong_password(cls, v: str) -> str:
        return _check_password(v)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    first_name: str
    last_name: str
    full_name: str
    phone: str
    email: str | None
    role: UserRole
    is_active: bool
    phone_verified: bool
    # Nurse HMB-verification status (None for mothers/admins). Drives the frontend gate.
    verification_status: str | None = None
