"""bookings table

Revision ID: 0009_bookings
Revises: 0008_split_name
Create Date: 2026-08-07

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0009_bookings"
down_revision: str | None = "0008_split_name"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "bookings",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("mother_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("nurse_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("care_date", sa.Date(), nullable=False),
        sa.Column("start_time", sa.String(length=5), nullable=False),
        sa.Column("hours", sa.Integer(), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("estimated_amount", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "requested", "accepted", "declined", "cancelled", "completed", name="booking_status"
            ),
            server_default="requested",
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["mother_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["nurse_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_bookings_mother_user_id", "bookings", ["mother_user_id"])
    op.create_index("ix_bookings_nurse_user_id", "bookings", ["nurse_user_id"])


def downgrade() -> None:
    op.drop_index("ix_bookings_nurse_user_id", table_name="bookings")
    op.drop_index("ix_bookings_mother_user_id", table_name="bookings")
    op.drop_table("bookings")
    sa.Enum(name="booking_status").drop(op.get_bind())
