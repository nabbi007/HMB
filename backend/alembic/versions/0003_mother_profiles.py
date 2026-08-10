"""mother_profiles table

Revision ID: 0003_mother_profiles
Revises: 0002_nurse_profiles
Create Date: 2026-07-24

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0003_mother_profiles"
down_revision: str | None = "0002_nurse_profiles"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "mother_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("community", sa.String(length=120), nullable=True),
        sa.Column("number_of_children", sa.Integer(), nullable=True),
        sa.Column("children_notes", sa.Text(), nullable=True),
        sa.Column(
            "avg_rating", sa.Numeric(precision=2, scale=1), server_default="0", nullable=False
        ),
        sa.Column("review_count", sa.Integer(), server_default="0", nullable=False),
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
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_mother_profiles_user_id", "mother_profiles", ["user_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_mother_profiles_user_id", table_name="mother_profiles")
    op.drop_table("mother_profiles")
