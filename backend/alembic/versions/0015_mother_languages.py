"""mother languages

Revision ID: 0015_mother_langs
Revises: 0014_nmc_pin_photo
Create Date: 2026-08-11

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0015_mother_langs"
down_revision: str | None = "0014_nmc_pin_photo"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("mother_profiles", sa.Column("languages", sa.ARRAY(sa.String()), nullable=True))


def downgrade() -> None:
    op.drop_column("mother_profiles", "languages")
