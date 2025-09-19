"""first migration

Revision ID: 9f6fa8d71b57
Revises: 
Create Date: 2025-09-19 14:20:37.065546

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9f6fa8d71b57'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Users table
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("canvas_id", sa.Integer, nullable=False, unique=True),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("phone_number", sa.String, nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.text('CURRENT_TIMESTAMP'))
    )

    # Courses table
    op.create_table(
        "courses",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("canvas_course_id", sa.Integer, nullable=False, unique=True),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("course_code", sa.String, nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.text('CURRENT_TIMESTAMP'))
    )

    # Course subscriptions table
    op.create_table(
        "course_subscriptions",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("course_id", sa.Integer, sa.ForeignKey("courses.id", ondelete="CASCADE"), nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, default=True),
        sa.Column("subscribed_at", sa.DateTime, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.UniqueConstraint("user_id", "course_id", name="unique_user_course_subscription")
    )

    # Assignments table
    op.create_table(
        "assignments",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("canvas_assignment_id", sa.Integer, nullable=False, unique=True),
        sa.Column("course_id", sa.Integer, sa.ForeignKey("courses.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String, nullable=False),
        sa.Column("due_date", sa.DateTime, nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.text('CURRENT_TIMESTAMP'))
    )

    # Notifications sent table
    op.create_table(
        "notifications_sent",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("assignment_id", sa.Integer, sa.ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False),
        sa.Column("notification_type", sa.String, nullable=False),  # "24hr", "day_of", "overdue"
        sa.Column("sent_at", sa.DateTime, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.UniqueConstraint("user_id", "assignment_id", "notification_type", name="unique_notification")
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop tables in reverse order to handle foreign key constraints
    op.drop_table("notifications_sent")
    op.drop_table("assignments")
    op.drop_table("course_subscriptions")
    op.drop_table("courses")
    op.drop_table("users")
