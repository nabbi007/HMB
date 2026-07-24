"""nurse_profiles table (verification + encrypted PIN)

Revision ID: 0002_nurse_profiles
Revises: 0001_users
Create Date: 2026-07-24

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002_nurse_profiles"
down_revision: str | None = "0001_users"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "nurse_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "verification_status",
            sa.Enum("pending", "verified", "rejected", name="verification_status"),
            server_default="pending",
            nullable=False,
        ),
        sa.Column("verification_reason", sa.Text(), nullable=True),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("verified_by_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("pin_encrypted", sa.Text(), nullable=True),
        sa.Column("pin_index", sa.String(length=64), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("job_description", sa.Text(), nullable=True),
        sa.Column("daily_rate", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("profile_photo_url", sa.String(length=500), nullable=True),
        sa.Column("passport_photo_url", sa.String(length=500), nullable=True),
        sa.Column("community", sa.String(length=120), nullable=True),
        sa.Column("avg_rating", sa.Numeric(precision=2, scale=1), server_default="0", nullable=False),
        sa.Column("review_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["verified_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_nurse_profiles_user_id", "nurse_profiles", ["user_id"], unique=True)
    op.create_index("ix_nurse_profiles_pin_index", "nurse_profiles", ["pin_index"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_nurse_profiles_pin_index", table_name="nurse_profiles")
    op.drop_index("ix_nurse_profiles_user_id", table_name="nurse_profiles")
    op.drop_table("nurse_profiles")
    sa.Enum(name="verification_status").drop(op.get_bind())
