import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class BookingStatus(str, enum.Enum):
    requested = "requested"
    accepted = "accepted"
    confirmed = "confirmed"  # accepted + paid (funds held in escrow)
    declined = "declined"
    cancelled = "cancelled"
    completed = "completed"


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mother_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    nurse_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    # Which child this booking is for (optional). SET NULL so deleting a child
    # keeps the booking record but drops the link.
    child_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("children.id", ondelete="SET NULL"), nullable=True
    )

    care_date: Mapped[date] = mapped_column(Date, nullable=False)  # first day
    start_time: Mapped[str] = mapped_column(String(5), nullable=False)  # "HH:MM"
    hours: Mapped[int] = mapped_column(Integer, nullable=False)  # per day
    days: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default="1")
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    # HMB-computed total (base + overage, less multi-day discount). Charged into escrow.
    estimated_amount: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)

    status: Mapped[BookingStatus] = mapped_column(
        Enum(BookingStatus, name="booking_status"),
        nullable=False,
        default=BookingStatus.requested,
        server_default=BookingStatus.requested.value,
    )
    # Escrow releases only when BOTH parties confirm the assignment is complete.
    mother_completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    nurse_completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
