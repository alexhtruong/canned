"""remove is_completed column from courses table

Revision ID: 2ebe23af7cdd
Revises: 39f48d045353
Create Date: 2025-10-07 15:49:35.802633

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2ebe23af7cdd'
down_revision: Union[str, Sequence[str], None] = '39f48d045353'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_column('user_courses', 'is_completed')


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column('user_courses', 'is_completed')
