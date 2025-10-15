"""add local completion tracking to submissions

Revision ID: 0c78044c764a
Revises: 702a45e290a5
Create Date: 2025-10-14 19:37:40.511427

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0c78044c764a'
down_revision: Union[str, Sequence[str], None] = '702a45e290a5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add columns for tracking local completion status."""
    op.add_column(
        'user_submissions',
        sa.Column('is_locally_complete', sa.Boolean, nullable=False, server_default=sa.text('0'))
    )
    op.add_column(
        'user_submissions',
        sa.Column('locally_completed_at', sa.DateTime, nullable=True)
    )

def downgrade() -> None:
    """Remove local completion tracking columns."""
    op.drop_column('user_submissions', 'locally_completed_at')
    op.drop_column('user_submissions', 'is_locally_complete')