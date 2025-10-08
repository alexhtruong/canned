"""Add assignments and submissions tables for cache layer

Revision ID: 9055e6a286df
Revises: 2ebe23af7cdd
Create Date: 2025-10-07 15:53:55.393033

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9055e6a286df'
down_revision: Union[str, Sequence[str], None] = '2ebe23af7cdd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'user_assignments',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('canvas_user_id', sa.Integer, nullable=False),
        sa.Column('canvas_assignment_id', sa.Integer, nullable=False),
        sa.Column('canvas_course_id', sa.Integer, nullable=False),
        sa.Column('assignment_name', sa.String, nullable=False),
        sa.Column('description', sa.String, nullable=True),
        sa.Column('html_url', sa.String, nullable=False),
        sa.Column('points_possible', sa.Float, nullable=True),
        sa.Column('due_at', sa.DateTime, nullable=True),
        sa.Column('grading_type', sa.String, nullable=True),  # points, pass_fail, percent, etc.
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        
        # Ensure one assignment per user
        sa.UniqueConstraint(
            'canvas_user_id',
            'canvas_assignment_id',
            name='uq_user_assignment'
        ),
        
        # FK 1: Reference user exists in users table
        sa.ForeignKeyConstraint(
            ['canvas_user_id'],
            ['users.canvas_id'],
            name='fk_assignment_user',
            ondelete='CASCADE'
        ),
        
        # FK 2: Reference (user, course) enrollment exists in user_courses
        sa.ForeignKeyConstraint(
            ['canvas_user_id', 'canvas_course_id'],
            ['user_courses.canvas_user_id', 'user_courses.canvas_course_id'],
            name='fk_assignment_course',
            ondelete='CASCADE'
        ),
    )
    
    op.create_table(
        'user_submissions',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('canvas_user_id', sa.Integer, nullable=False),
        sa.Column('canvas_submission_id', sa.Integer, nullable=True),  # Null if not submitted
        sa.Column('canvas_assignment_id', sa.Integer, nullable=False),
        sa.Column('workflow_state', sa.String, nullable=False),  # unsubmitted, submitted, graded, etc.
        sa.Column('score', sa.Float, nullable=True),  # Null until graded
        sa.Column('grade', sa.String, nullable=True),  # Letter grade, pass/fail, etc.
        sa.Column('submitted_at', sa.DateTime, nullable=True),  # Null if not submitted
        sa.Column('late', sa.Boolean, nullable=False, default=False),
        sa.Column('missing', sa.Boolean, nullable=False, default=False),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        
        # One submission per user per assignment
        sa.UniqueConstraint(
            'canvas_user_id',
            'canvas_assignment_id',
            name='uq_user_submission'
        ),
        
        # FK 1: Reference user exists in users table
        sa.ForeignKeyConstraint(
            ['canvas_user_id'],
            ['users.canvas_id'],
            name='fk_submission_user',
            ondelete='CASCADE'
        ),
        
        # FK 2: Reference (user, assignment) exists in user_assignments
        sa.ForeignKeyConstraint(
            ['canvas_user_id', 'canvas_assignment_id'],
            ['user_assignments.canvas_user_id', 'user_assignments.canvas_assignment_id'],
            name='fk_submission_assignment',
            ondelete='CASCADE'
        ),
    )


def downgrade() -> None:
    # Drop in reverse order due to foreign keys
    op.drop_table('user_submissions')
    op.drop_table('user_assignments')
