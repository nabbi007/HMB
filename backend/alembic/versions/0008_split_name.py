"""split users.full_name into first_name + last_name

Revision ID: 0008_split_name
Revises: 0007_nurse_attributes
Create Date: 2026-08-06

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0008_split_name"
down_revision: str | None = "0007_nurse_attributes"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("users", sa.Column("first_name", sa.String(length=60), nullable=True))
    op.add_column("users", sa.Column("last_name", sa.String(length=60), nullable=True))
    # Backfill from the existing full_name (split on the first space).
    op.execute(
        """
        UPDATE users
        SET first_name = split_part(full_name, ' ', 1),
            last_name = CASE
                WHEN position(' ' in full_name) > 0
                THEN substring(full_name from position(' ' in full_name) + 1)
                ELSE full_name
            END
        """
    )
    op.alter_column("users", "first_name", nullable=False)
    op.alter_column("users", "last_name", nullable=False)
    op.drop_column("users", "full_name")


def downgrade() -> None:
    op.add_column("users", sa.Column("full_name", sa.String(length=120), nullable=True))
    op.execute("UPDATE users SET full_name = first_name || ' ' || last_name")
    op.alter_column("users", "full_name", nullable=False)
    op.drop_column("users", "last_name")
    op.drop_column("users", "first_name")
