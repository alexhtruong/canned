"""add is_subscribed column to user_courses

Revision ID: e833f8b39e29
Revises: 0c78044c764a
Create Date: 2025-11-01 17:14:31.403342

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e833f8b39e29"
down_revision: Union[str, Sequence[str], None] = "0c78044c764a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "user_courses",
        sa.Column(
            "is_subscribed", sa.Boolean(), nullable=False, server_default="FALSE"
        ),
    )

    # fill in user_courses.is_subscribed from course_subscriptions
    op.execute("""
        UPDATE user_courses
        SET is_subscribed = TRUE
        WHERE EXISTS (
            SELECT 1
            FROM course_subscriptions cs
            WHERE cs.canvas_user_id = user_courses.canvas_user_id
            AND cs.canvas_course_id = user_courses.canvas_course_id
            AND cs.is_active = TRUE
        )
    """)

    op.create_table(
        "subscription_history",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("canvas_user_id", sa.Integer(), nullable=False),
        sa.Column("canvas_course_id", sa.Integer(), nullable=False),
        sa.Column("action", sa.String(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()
        ),
    )

    op.execute("""
        INSERT INTO subscription_history (canvas_user_id, canvas_course_id, action, created_at)
        SELECT
            canvas_user_id,
            canvas_course_id,
            CASE WHEN is_active THEN 'subscribed' ELSE 'unsubscribed' END,
            subscribed_at
        FROM course_subscriptions
        ORDER BY subscribed_at
    """)

    # Drop the old course_subscriptions table
    op.drop_table("course_subscriptions")


def downgrade() -> None:
    # 1. Drop table if exists, then recreate course_subscriptions table
    op.execute("DROP TABLE IF EXISTS course_subscriptions")

    op.create_table(
        "course_subscriptions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("canvas_user_id", sa.Integer(), nullable=False),
        sa.Column("canvas_course_id", sa.Integer(), nullable=False),
        sa.Column("course_name", sa.String(), nullable=False),
        sa.Column("course_code", sa.String(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="TRUE"),
        sa.Column(
            "subscribed_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")
        ),
        sa.UniqueConstraint(
            "canvas_user_id", "canvas_course_id", name="unique_user_course_subscription"
        ),
    )

    # 2. Restore subscription data from user_courses
    op.execute("""
        INSERT INTO course_subscriptions (
            canvas_user_id,
            canvas_course_id,
            course_name,
            course_code,
            is_active,
            subscribed_at
        )
        SELECT
            uc.canvas_user_id,
            uc.canvas_course_id,
            uc.course_name,
            uc.course_code,
            uc.is_subscribed,
            COALESCE(
                (SELECT MIN(created_at)
                 FROM subscription_history sh
                 WHERE sh.canvas_user_id = uc.canvas_user_id
                 AND sh.canvas_course_id = uc.canvas_course_id
                 AND sh.action = 'subscribed'),
                CURRENT_TIMESTAMP
            )
        FROM user_courses uc
        WHERE uc.is_subscribed = TRUE
           OR EXISTS (
               SELECT 1 FROM subscription_history sh2
               WHERE sh2.canvas_user_id = uc.canvas_user_id
               AND sh2.canvas_course_id = uc.canvas_course_id
           )
    """)

    # 3. Drop the is_subscribed column
    op.drop_column("user_courses", "is_subscribed")

    # 4. Drop the history table
    op.drop_table("subscription_history")
