import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class MotherProfile(Base):
    __tablename__ = "mother_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )

    # Public-ish location: the area used to find nearby nurses.
    # (Exact geo point is added in HMB-30 and stays gated behind a confirmed booking.)
    community: Mapped[str | None] = mapped_column(String(120), nullable=True)
    # Location (from place autocomplete) — centres her map / used to find nearby nurses.
    latitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)

    # --- Sensitive: information about minors. API-gated (mother / matched nurse / admin). ---
    number_of_children: Mapped[int | None] = mapped_column(Integer, nullable=True)
    children_notes: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )  # ages, allergies, needs

    # --- Reputation (reviews run both ways, so nurses can see a mother's rating) ---
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
