"""nurse certifications (uploaded licenses/certs)

Revision ID: 0013_nurse_certs
Revises: 0012_child_booking
Create Date: 2026-08-10

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0013_nurse_certs"
down_revision: str | None = "0012_child_booking"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "nurse_profiles",
        sa.Column("certifications", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("nurse_profiles", "certifications")
