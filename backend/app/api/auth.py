import secrets
import uuid
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.models.mother_profile import MotherProfile
from app.models.nurse_profile import NurseProfile
from app.models.otp import OtpCode
from app.models.user import User, UserRole
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    OtpVerifyRequest,
    RefreshRequest,
    ResetPasswordRequest,
    SignupRequest,
    TokenResponse,
    UserOut,
    UserUpdate,
    VerifyResetCodeRequest,
)
from app.services import email as email_service

router = APIRouter(prefix="/auth", tags=["auth"])


def _tokens_for(user_id: uuid.UUID) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(str(user_id)),
        refresh_token=create_refresh_token(str(user_id)),
    )


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(data: SignupRequest, db: Session = Depends(get_db)) -> TokenResponse:
    # Reject duplicates on phone (and email when provided).
    filters = [User.phone == data.phone]
    if data.email:
        filters.append(User.email == data.email)
    if db.query(User).filter(or_(*filters)).first() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with that phone or email already exists",
        )

    user = User(
        role=data.role,
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
        email=data.email,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    db.flush()  # assign user.id before creating the linked profile

    # Create the matching (empty) profile so the dashboard has something to edit.
    if data.role == UserRole.nurse:
        db.add(NurseProfile(user_id=user.id))
    elif data.role == UserRole.mother:
        db.add(MotherProfile(user_id=user.id))

    db.commit()
    db.refresh(user)
    return _tokens_for(user.id)


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = (
        db.query(User)
        .filter(or_(User.phone == data.identifier, User.email == data.identifier))
        .first()
    )
    # Same error whether the user is missing or the password is wrong (no account enumeration).
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid phone/email or password"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="This account has been suspended"
        )
    return _tokens_for(user.id)


@router.post("/refresh", response_model=TokenResponse)
def refresh(data: RefreshRequest, db: Session = Depends(get_db)) -> TokenResponse:
    invalid = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token"
    )
    try:
        payload = decode_token(data.refresh_token)
        if payload.get("type") != "refresh":
            raise invalid
        user_id = uuid.UUID(payload["sub"])
    except (JWTError, KeyError, ValueError) as exc:
        raise invalid from exc

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise invalid
    # Rotate both tokens on refresh.
    return _tokens_for(user.id)


def _user_out(db: Session, user: User) -> UserOut:
    verification_status: str | None = None
    photo_url: str | None = None
    if user.role == UserRole.nurse:
        profile = db.query(NurseProfile).filter(NurseProfile.user_id == user.id).first()
        if profile is not None:
            verification_status = profile.verification_status.value
            photo_url = profile.profile_photo_url
    elif user.role == UserRole.mother:
        mprofile = db.query(MotherProfile).filter(MotherProfile.user_id == user.id).first()
        if mprofile is not None:
            photo_url = mprofile.profile_photo_url
    return UserOut(
        id=user.id,
        first_name=user.first_name,
        last_name=user.last_name,
        full_name=user.full_name,
        phone=user.phone,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        phone_verified=user.phone_verified,
        verification_status=verification_status,
        profile_photo_url=photo_url,
    )


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> UserOut:
    return _user_out(db, user)


@router.patch("/me", response_model=UserOut)
def update_me(
    data: UserUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserOut:
    """Update the current user's editable account fields. Email is NOT editable here."""
    fields = data.model_dump(exclude_unset=True)

    new_phone = fields.get("phone")
    if new_phone is not None and new_phone != user.phone:
        clash = db.query(User).filter(User.phone == new_phone, User.id != user.id).first()
        if clash is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="That phone number is already in use",
            )
        user.phone = new_phone

    if fields.get("first_name"):
        user.first_name = fields["first_name"]
    if fields.get("last_name"):
        user.last_name = fields["last_name"]

    db.commit()
    db.refresh(user)
    return _user_out(db, user)


def _generate_code() -> str:
    upper = 10**settings.otp_length
    return f"{secrets.randbelow(upper):0{settings.otp_length}d}"


@router.post("/otp/request", status_code=status.HTTP_200_OK)
def request_otp(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> dict[str, str]:
    """Email a fresh verification code to the current user (dev: caught by Mailpit)."""
    if not user.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No email on file to send a verification code to",
        )

    now = datetime.now(UTC)

    # Cooldown: block rapid resends (email/SMS-cost abuse).
    latest = (
        db.query(OtpCode)
        .filter(OtpCode.user_id == user.id)
        .order_by(OtpCode.created_at.desc())
        .first()
    )
    if latest is not None:
        age = (now - latest.created_at).total_seconds()
        if age < settings.otp_resend_cooldown_seconds:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Please wait before requesting another code",
            )

    # Invalidate any outstanding codes, then issue a new one.
    db.query(OtpCode).filter(OtpCode.user_id == user.id, OtpCode.consumed_at.is_(None)).delete(
        synchronize_session=False
    )

    code = _generate_code()
    otp = OtpCode(
        user_id=user.id,
        code_hash=hash_password(code),
        expires_at=now + timedelta(minutes=settings.otp_expire_minutes),
    )
    db.add(otp)
    db.commit()

    try:
        email_service.send_otp_email(user.email, code)
    except Exception as exc:  # noqa: BLE001 - surface any SMTP failure as a clear 502
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not send the verification email",
        ) from exc

    return {"detail": "Verification code sent"}


@router.post("/otp/verify", status_code=status.HTTP_200_OK)
def verify_otp(
    data: OtpVerifyRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    otp = (
        db.query(OtpCode)
        .filter(OtpCode.user_id == user.id, OtpCode.consumed_at.is_(None))
        .order_by(OtpCode.created_at.desc())
        .first()
    )
    if otp is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No verification code requested"
        )
    if otp.expires_at < datetime.now(UTC):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Verification code has expired"
        )
    if otp.attempts >= settings.otp_max_attempts:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many attempts — request a new code",
        )
    if not verify_password(data.code, otp.code_hash):
        otp.attempts += 1
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification code"
        )

    otp.consumed_at = datetime.now(UTC)
    user.phone_verified = True  # "contact verified" — channel is email in dev, SMS later
    db.commit()
    return {"detail": "Verified"}


def _find_by_identifier(db: Session, identifier: str) -> User | None:
    return db.query(User).filter(or_(User.phone == identifier, User.email == identifier)).first()


@router.post("/password/forgot", status_code=status.HTTP_200_OK)
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)) -> dict[str, str]:
    """Email a password-reset code. Always returns 200 (no account enumeration)."""
    user = _find_by_identifier(db, data.identifier)
    if user is not None and user.email:
        db.query(OtpCode).filter(
            OtpCode.user_id == user.id,
            OtpCode.purpose == "reset",
            OtpCode.consumed_at.is_(None),
        ).delete(synchronize_session=False)
        code = _generate_code()
        db.add(
            OtpCode(
                user_id=user.id,
                purpose="reset",
                code_hash=hash_password(code),
                expires_at=datetime.now(UTC) + timedelta(minutes=settings.otp_expire_minutes),
            )
        )
        db.commit()
        try:
            email_service.send_password_reset_email(user.email, code)
        except Exception:  # noqa: BLE001 - don't reveal send failures to the caller
            pass
    return {"detail": "If an account exists, a reset code has been sent"}


@router.post("/password/verify", status_code=status.HTTP_200_OK)
def verify_reset_code(
    data: VerifyResetCodeRequest, db: Session = Depends(get_db)
) -> dict[str, str]:
    """Check a reset code before showing the new-password step. Does NOT consume it —
    the /password/reset call consumes it together with setting the new password."""
    invalid = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset code"
    )
    user = _find_by_identifier(db, data.identifier)
    if user is None:
        raise invalid

    otp = (
        db.query(OtpCode)
        .filter(
            OtpCode.user_id == user.id,
            OtpCode.purpose == "reset",
            OtpCode.consumed_at.is_(None),
        )
        .order_by(OtpCode.created_at.desc())
        .first()
    )
    if otp is None or otp.expires_at < datetime.now(UTC):
        raise invalid
    if otp.attempts >= settings.otp_max_attempts:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many attempts — request a new reset code",
        )
    if not verify_password(data.code, otp.code_hash):
        otp.attempts += 1
        db.commit()
        raise invalid
    return {"detail": "Code verified"}


@router.post("/password/reset", status_code=status.HTTP_200_OK)
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)) -> dict[str, str]:
    invalid = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset code"
    )
    user = _find_by_identifier(db, data.identifier)
    if user is None:
        raise invalid

    otp = (
        db.query(OtpCode)
        .filter(
            OtpCode.user_id == user.id,
            OtpCode.purpose == "reset",
            OtpCode.consumed_at.is_(None),
        )
        .order_by(OtpCode.created_at.desc())
        .first()
    )
    if otp is None or otp.expires_at < datetime.now(UTC):
        raise invalid
    if otp.attempts >= settings.otp_max_attempts:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many attempts — request a new reset code",
        )
    if not verify_password(data.code, otp.code_hash):
        otp.attempts += 1
        db.commit()
        raise invalid

    otp.consumed_at = datetime.now(UTC)
    user.password_hash = hash_password(data.new_password)
    db.commit()
    return {"detail": "Password has been reset"}
