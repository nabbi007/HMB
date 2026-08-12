"""mother profile photo

Revision ID: 0017_mother_photo
Revises: 0016_pricing_avail
Create Date: 2026-08-12

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0017_mother_photo"
down_revision: str | None = "0016_pricing_avail"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "mother_profiles", sa.Column("profile_photo_url", sa.String(length=500), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("mother_profiles", "profile_photo_url")
