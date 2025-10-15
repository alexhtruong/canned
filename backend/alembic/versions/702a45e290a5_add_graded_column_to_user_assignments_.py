"""add graded column to user_assignments table

Revision ID: 702a45e290a5
Revises: 6c7e12ea7e0e
Create Date: 2025-10-14 17:05:13.891000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '702a45e290a5'
down_revision: Union[str, Sequence[str], None] = '6c7e12ea7e0e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "user_assignments",
        sa.Column('graded', sa.Boolean, nullable=False, server_default=sa.text('0'))
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("user_assignments", "graded")
