"""payments table + confirmed booking status

Revision ID: 0011_payments
Revises: 0010_messages
Create Date: 2026-08-08

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0011_payments"
down_revision: str | None = "0010_messages"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # A paid+accepted booking becomes "confirmed" (funds held in escrow).
    op.execute("ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'confirmed'")

    op.create_table(
        "payments",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("booking_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("amount", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("hmb_fee", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("nurse_payout", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "pending", "held", "released", "refunded", "failed", name="payment_status"
            ),
            server_default="pending",
            nullable=False,
        ),
        sa.Column("provider_ref", sa.String(length=80), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.ForeignKeyConstraint(["booking_id"], ["bookings.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("booking_id"),
    )
    op.create_index("ix_payments_booking_id", "payments", ["booking_id"])


def downgrade() -> None:
    op.drop_index("ix_payments_booking_id", table_name="payments")
    op.drop_table("payments")
    sa.Enum(name="payment_status").drop(op.get_bind())
    # Note: Postgres can't drop a single enum value; 'confirmed' stays on booking_status.
