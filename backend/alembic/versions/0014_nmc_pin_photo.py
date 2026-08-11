"""nmc pin photo (upload instead of typing the PIN)

Revision ID: 0014_nmc_pin_photo
Revises: 0013_nurse_certs
Create Date: 2026-08-11

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0014_nmc_pin_photo"
down_revision: str | None = "0013_nurse_certs"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "nurse_profiles", sa.Column("nmc_pin_photo_url", sa.String(length=500), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("nurse_profiles", "nmc_pin_photo_url")
