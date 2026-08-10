"""child allergies field + link a booking to a child

Revision ID: 0012_child_booking
Revises: 0011_payments
Create Date: 2026-08-10

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0012_child_booking"
down_revision: str | None = "0011_payments"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("children", sa.Column("allergies", sa.Text(), nullable=True))
    op.add_column(
        "bookings", sa.Column("child_id", postgresql.UUID(as_uuid=True), nullable=True)
    )
    op.create_foreign_key(
        "fk_bookings_child_id",
        "bookings",
        "children",
        ["child_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_bookings_child_id", "bookings", type_="foreignkey")
    op.drop_column("bookings", "child_id")
    op.drop_column("children", "allergies")
