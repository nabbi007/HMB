"""add latitude/longitude to profiles

Revision ID: 0005_profile_location
Revises: 0004_otp_codes
Create Date: 2026-08-05

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0005_profile_location"
down_revision: str | None = "0004_otp_codes"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    for table in ("nurse_profiles", "mother_profiles"):
        op.add_column(table, sa.Column("latitude", sa.Numeric(precision=9, scale=6), nullable=True))
        op.add_column(
            table, sa.Column("longitude", sa.Numeric(precision=9, scale=6), nullable=True)
        )


def downgrade() -> None:
    for table in ("nurse_profiles", "mother_profiles"):
        op.drop_column(table, "longitude")
        op.drop_column(table, "latitude")
