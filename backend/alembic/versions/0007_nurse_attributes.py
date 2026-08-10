"""nurse values-matching attributes (languages, religion, care_type)

Revision ID: 0007_nurse_attributes
Revises: 0006_children
Create Date: 2026-08-05

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0007_nurse_attributes"
down_revision: str | None = "0006_children"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "nurse_profiles", sa.Column("languages", postgresql.ARRAY(sa.String()), nullable=True)
    )
    op.add_column("nurse_profiles", sa.Column("religion", sa.String(length=60), nullable=True))
    op.add_column("nurse_profiles", sa.Column("care_type", sa.String(length=60), nullable=True))


def downgrade() -> None:
    op.drop_column("nurse_profiles", "care_type")
    op.drop_column("nurse_profiles", "religion")
    op.drop_column("nurse_profiles", "languages")
