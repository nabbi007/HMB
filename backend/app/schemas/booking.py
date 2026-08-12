import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class BookingCreate(BaseModel):
    nurse_id: uuid.UUID
    child_id: uuid.UUID | None = None
    care_date: date  # first day
    start_time: str = Field(pattern=r"^\d{2}:\d{2}$")
    hours: int = Field(ge=1, le=24)  # per day
    days: int = Field(default=1, ge=1, le=90)
    note: str | None = Field(default=None, max_length=1000)


class BookingOut(BaseModel):
    id: uuid.UUID
    status: str
    care_date: date
    start_time: str
    hours: int
    days: int
    note: str | None
    estimated_amount: Decimal | None
    created_at: datetime
    # Dual-confirmation escrow: released to the caregiver only when both are true.
    mother_completed: bool = False
    nurse_completed: bool = False
    # Both parties, so one shape serves the mother's list and the nurse's requests.
    nurse_user_id: uuid.UUID
    nurse_name: str
    nurse_photo_url: str | None
    mother_user_id: uuid.UUID
    mother_name: str
    # Payment (present once the mother has paid). None while unpaid.
    payment_status: str | None = None
    hmb_fee: Decimal | None = None
    nurse_payout: Decimal | None = None
    # Child this booking is for — readable by the two parties + admin (the API
    # only ever returns a booking to its own mother, nurse, or an admin).
    child_id: uuid.UUID | None = None
    child_name: str | None = None
    child_age_years: int | None = None
    child_allergies: str | None = None
    child_notes: str | None = None
