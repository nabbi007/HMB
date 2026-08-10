import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class VerificationStatus(str, enum.Enum):
    pending = "pending"
    verified = "verified"
    rejected = "rejected"


class NurseProfile(Base):
    __tablename__ = "nurse_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )

    # --- Verification (admin-controlled; nurse starts pending & invisible to search) ---
    verification_status: Mapped[VerificationStatus] = mapped_column(
        Enum(VerificationStatus, name="verification_status"),
        nullable=False,
        default=VerificationStatus.pending,
        server_default=VerificationStatus.pending.value,
    )
    verification_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    verified_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # --- Nursing & Midwifery Council PIN ---
    # Encrypted (reversible) so an admin can read it to check the official register.
    pin_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Blind index (keyed HMAC) — enforces one-PIN-per-nurse without decrypting.
    pin_index: Mapped[str | None] = mapped_column(
        String(64), unique=True, index=True, nullable=True
    )

    # --- Profile content ---
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    job_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    daily_rate: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    # Values-matching attributes (searchable).
    languages: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    religion: Mapped[str | None] = mapped_column(String(60), nullable=True)
    care_type: Mapped[str | None] = mapped_column(String(60), nullable=True)
    profile_photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    passport_photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # Optional uploaded certifications/licenses: list of {"name": str, "url": str}.
    certifications: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    community: Mapped[str | None] = mapped_column(String(120), nullable=True)
    # Approximate location (from place autocomplete). Public-facing area, not exact home.
    latitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)

    # --- Reputation ---
    avg_rating: Mapped[float] = mapped_column(
        Numeric(2, 1), nullable=False, default=0, server_default="0"
    )
    review_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    user = relationship("User", foreign_keys=[user_id])

    @property
    def is_verified(self) -> bool:
        return self.verification_status == VerificationStatus.verified

    @property
    def has_pin(self) -> bool:
        return self.pin_encrypted is not None
