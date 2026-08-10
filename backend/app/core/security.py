import re
from datetime import UTC, datetime, timedelta

import bcrypt
from jose import jwt

from app.core.config import settings


def password_error(password: str) -> str | None:
    """Return an error message if the password is too weak, else None.

    Rule: at least 6 characters, one number, and one special character.
    """
    if len(password) < 6:
        return "Password must be at least 6 characters"
    if not re.search(r"\d", password):
        return "Password must include at least one number"
    if not re.search(r"[^A-Za-z0-9]", password):
        return "Password must include at least one special character"
    return None


def _pw_bytes(password: str) -> bytes:
    # bcrypt only considers the first 72 bytes; truncating keeps hash/verify consistent
    # and avoids bcrypt 4.x raising on longer inputs.
    return password.encode("utf-8")[:72]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_pw_bytes(password), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(_pw_bytes(password), password_hash.encode("utf-8"))


# --- JWT ---


def _create_token(subject: str, token_type: str, expires_delta: timedelta) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": str(subject),
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(subject: str) -> str:
    return _create_token(subject, "access", timedelta(minutes=settings.access_token_expire_minutes))


def create_refresh_token(subject: str) -> str:
    return _create_token(subject, "refresh", timedelta(days=settings.refresh_token_expire_days))


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
