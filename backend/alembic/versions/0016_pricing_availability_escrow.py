"""booking days + dual-completion escrow + caregiver availability

Revision ID: 0016_pricing_avail
Revises: 0015_mother_langs
Create Date: 2026-08-12

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0016_pricing_avail"
down_revision: str | None = "0015_mother_langs"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "bookings", sa.Column("days", sa.Integer(), nullable=False, server_default="1")
    )
    op.add_column(
        "bookings", sa.Column("mother_completed_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column(
        "bookings", sa.Column("nurse_completed_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column(
        "nurse_profiles",
        sa.Column("is_available", sa.Boolean(), nullable=False, server_default="true"),
    )


def downgrade() -> None:
    op.drop_column("nurse_profiles", "is_available")
    op.drop_column("bookings", "nurse_completed_at")
    op.drop_column("bookings", "mother_completed_at")
    op.drop_column("bookings", "days")
