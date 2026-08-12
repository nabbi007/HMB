import uuid
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class CertificationItem(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    url: str = Field(min_length=1, max_length=500)


class NurseProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    bio: str | None
    job_description: str | None
    community: str | None
    latitude: Decimal | None
    longitude: Decimal | None
    languages: list[str] | None
    is_available: bool
    profile_photo_url: str | None
    passport_photo_url: str | None
    nmc_pin_photo_url: str | None
    certifications: list[CertificationItem] | None
    verification_status: str
    avg_rating: Decimal
    review_count: int


class NurseProfileUpdate(BaseModel):
    bio: str | None = Field(default=None, max_length=2000)
    job_description: str | None = Field(default=None, max_length=2000)
    community: str | None = Field(default=None, max_length=120)
    latitude: Decimal | None = Field(default=None, ge=-90, le=90)
    longitude: Decimal | None = Field(default=None, ge=-180, le=180)
    languages: list[str] | None = Field(default=None, max_length=10)
    # Caregivers set their availability, NOT their price (HMB controls pricing).
    is_available: bool | None = None
    profile_photo_url: str | None = Field(default=None, max_length=500)
    passport_photo_url: str | None = Field(default=None, max_length=500)
    nmc_pin_photo_url: str | None = Field(default=None, max_length=500)
    certifications: list[CertificationItem] | None = Field(default=None, max_length=20)


class NurseSearchResult(BaseModel):
    """A verified nurse as seen by a searching parent. Approximate location only."""

    id: uuid.UUID  # the nurse's user id
    name: str
    bio: str | None
    community: str | None
    languages: list[str]
    is_available: bool
    rating: Decimal
    review_count: int
    distance_km: float
    lat: float
    lng: float
    profile_photo_url: str | None


class NursePublic(BaseModel):
    """A verified nurse's public detail (for the nurse detail page)."""

    id: uuid.UUID  # the nurse's user id
    name: str
    bio: str | None
    community: str | None
    languages: list[str]
    is_available: bool
    rating: Decimal
    review_count: int
    profile_photo_url: str | None


class MotherProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    community: str | None
    latitude: Decimal | None
    longitude: Decimal | None
    languages: list[str] | None
    profile_photo_url: str | None
    number_of_children: int | None
    children_notes: str | None
    avg_rating: Decimal
    review_count: int


class MotherProfileUpdate(BaseModel):
    community: str | None = Field(default=None, max_length=120)
    latitude: Decimal | None = Field(default=None, ge=-90, le=90)
    longitude: Decimal | None = Field(default=None, ge=-180, le=180)
    languages: list[str] | None = Field(default=None, max_length=10)
    profile_photo_url: str | None = Field(default=None, max_length=500)
    number_of_children: int | None = Field(default=None, ge=0, le=20)
    children_notes: str | None = Field(default=None, max_length=2000)
