"""add is_active column to user_courses

Revision ID: 5aa3d0e1dab1
Revises: 9055e6a286df
Create Date: 2025-10-07 17:55:24.116351

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5aa3d0e1dab1'
down_revision: Union[str, Sequence[str], None] = '9055e6a286df'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'user_courses',
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='0')
    )


def downgrade() -> None:
    op.drop_column('user_courses', 'is_active')
