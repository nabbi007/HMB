import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class AdminNurseOut(BaseModel):
    """A nurse as seen by an admin reviewing verification — includes the decrypted
    NMC PIN so it can be checked against the official register (admin-only)."""

    user_id: uuid.UUID
    first_name: str
    last_name: str
    full_name: str
    email: str | None
    phone: str
    community: str | None
    care_type: str | None
    languages: list[str]
    bio: str | None
    daily_rate: Decimal | None
    verification_status: str
    verification_reason: str | None
    has_pin: bool
    nmc_pin: str | None
    profile_photo_url: str | None
    passport_photo_url: str | None
    created_at: datetime


class RejectRequest(BaseModel):
    reason: str = Field(min_length=3, max_length=500)
