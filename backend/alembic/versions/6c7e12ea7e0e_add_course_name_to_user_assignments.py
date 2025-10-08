"""add course name to user assignments

Revision ID: 6c7e12ea7e0e
Revises: 5aa3d0e1dab1
Create Date: 2025-10-08 11:35:15.614525

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6c7e12ea7e0e'
down_revision: Union[str, Sequence[str], None] = '5aa3d0e1dab1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add course_name column to user_assignments table."""
    # SQLite-compatible approach using batch_alter_table
    with op.batch_alter_table('user_assignments') as batch_op:
        batch_op.add_column(sa.Column('course_name', sa.String, nullable=True))
    
    # Backfill existing rows with course names from user_courses
    op.execute("""
        UPDATE user_assignments
        SET course_name = (
            SELECT course_name
            FROM user_courses
            WHERE user_courses.canvas_user_id = user_assignments.canvas_user_id
              AND user_courses.canvas_course_id = user_assignments.canvas_course_id
        )
    """)
    
    # Recreate table with non-nullable course_name
    # This is the SQLite-compatible way to make a column NOT NULL
    with op.batch_alter_table('user_assignments') as batch_op:
        batch_op.alter_column('course_name', nullable=False)


def downgrade() -> None:
    """Remove course_name column from user_assignments table."""
    with op.batch_alter_table('user_assignments') as batch_op:
        batch_op.drop_column('course_name')
