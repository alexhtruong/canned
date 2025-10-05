"""added courses table

Revision ID: 39f48d045353
Revises: cfdff14de535
Create Date: 2025-10-03 18:42:13.157945

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '39f48d045353'
down_revision: Union[str, Sequence[str], None] = 'cfdff14de535'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "user_courses",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("canvas_user_id", sa.Integer, nullable=False),
        sa.Column("canvas_course_id", sa.Integer, nullable=False),
        sa.Column("course_name", sa.String, nullable=False),
        sa.Column("course_code", sa.String, nullable=False),
        sa.Column("term_id", sa.Integer),
        sa.Column("term_name", sa.String),
        sa.Column("term_start_at", sa.DateTime),
        sa.Column("is_completed", sa.Boolean, default=True),
        sa.UniqueConstraint("canvas_user_id", "canvas_course_id", name="unique_user_course_enrollment"),
        sa.ForeignKeyConstraint(["canvas_user_id"], ["users.canvas_id"], name="fk_user_courses_canvas_user_id")
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("user_courses")
