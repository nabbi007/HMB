import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class AdminNurseOut(BaseModel):
    """A nurse as seen by an admin reviewing verification — includes the uploaded
    NMC PIN / license photo so it can be checked against the official register."""

    user_id: uuid.UUID
    first_name: str
    last_name: str
    full_name: str
    email: str | None
    phone: str
    community: str | None
    languages: list[str]
    bio: str | None
    daily_rate: Decimal | None
    verification_status: str
    verification_reason: str | None
    profile_photo_url: str | None
    passport_photo_url: str | None
    nmc_pin_photo_url: str | None
    created_at: datetime


class RejectRequest(BaseModel):
    reason: str = Field(min_length=3, max_length=500)
