import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.session import get_db
from app.models.nurse_profile import NurseProfile, VerificationStatus
from app.models.user import User, UserRole

bearer_scheme = HTTPBearer(auto_error=False)

_CREDENTIALS_EXC = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if creds is None:
        raise _CREDENTIALS_EXC
    try:
        payload = decode_token(creds.credentials)
        if payload.get("type") != "access":
            raise _CREDENTIALS_EXC
        user_id = uuid.UUID(payload["sub"])
    except (JWTError, KeyError, ValueError) as exc:
        raise _CREDENTIALS_EXC from exc

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise _CREDENTIALS_EXC
    return user


def require_role(*roles: UserRole):
    """Dependency factory: only the given roles may pass."""

    def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions"
            )
        return user

    return checker


def require_verified_nurse(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> User:
    """A nurse may reach the dashboard while pending, but nurse *tasks* need verification."""
    if user.role != UserRole.nurse:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Nurse account required")
    profile = db.query(NurseProfile).filter(NurseProfile.user_id == user.id).first()
    if profile is None or profile.verification_status != VerificationStatus.verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending HMB verification",
        )
    return user
