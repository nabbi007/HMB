"""Reversible encryption + blind index for sensitive-but-readable values (the nurse PIN).

Unlike passwords (one-way hashed in security.py), the nurse PIN must be readable by
an admin to verify it against the Nursing & Midwifery Council register — so it's
encrypted (two-way), not hashed.

- encrypt_pin / decrypt_pin: Fernet (AES) — non-deterministic, reversible with the key.
- pin_blind_index: deterministic keyed HMAC — lets us enforce uniqueness and look up a
  PIN without ever decrypting, since the encrypted values differ every time.
"""

import base64
import hashlib
import hmac

from cryptography.fernet import Fernet

from app.core.config import settings


def _load_key() -> bytes:
    if settings.pin_encryption_key:
        return settings.pin_encryption_key.encode()
    # Dev-only fallback so the app boots without config. NEVER rely on this in prod
    # (it's derived from a public constant, so it protects nothing).
    return base64.urlsafe_b64encode(hashlib.sha256(b"hmb-dev-fallback").digest())


_fernet = Fernet(_load_key())


def _normalize(pin: str) -> str:
    """Strip whitespace and upper-case so 'ap 12345' and 'AP12345' are treated the same."""
    return "".join(pin.split()).upper()


def encrypt_pin(pin: str) -> str:
    return _fernet.encrypt(_normalize(pin).encode()).decode()


def decrypt_pin(token: str) -> str:
    return _fernet.decrypt(token.encode()).decode()


def pin_blind_index(pin: str) -> str:
    """Deterministic, non-reversible fingerprint for uniqueness checks / lookup."""
    return hmac.new(
        settings.pin_index_key.encode(), _normalize(pin).encode(), hashlib.sha256
    ).hexdigest()
