from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Dict, Any
from pydantic import BaseModel
import sqlalchemy
from sqlalchemy.sql.sqltypes import BOOLEANTYPE
import logging

from src.utils.canvas import fetch_canvas_courses
from src import database as db
from src.auth import verify_api_key
from src.models.subscription import (
    CourseSubscriptionRequest,
    CourseSubscriptionResponse,
    CourseUnsubscriptionResponse,
    Subscription,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/subscriptions",
    tags=["subscriptions"],
)


class ToggleSubscriptionRequest(BaseModel):
    is_active: bool


@router.put("/courses/{course_id}")
def toggle_subscription(
    course_id: int,
    request: ToggleSubscriptionRequest,
    auth_info: Dict[str, Any] = Depends(verify_api_key),
):
    user_id = auth_info["user_id"]
    return


@router.post("/courses/{course_id}", response_model=CourseSubscriptionResponse)
async def subscribe_to_course(
    course_id: int,
    request: CourseSubscriptionRequest,
    auth_info: Dict[str, Any] = Depends(verify_api_key),
):
    """
    Subscribe to a course for notifications.

    - **canvas_course_id**: The Canvas course ID to subscribe to
    - Returns subscription details on success
    """
    canvas_user_id = auth_info["user_id"]
    # Validate course exists and user has access
    try:
        # First get course details
        course_info = get_course_info(canvas_user_id, course_id)
        if not course_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Course not found"
            )

        with db.engine.begin() as connection:
            params = {
                "canvas_user_id": canvas_user_id,
                "canvas_course_id": course_id,
                "course_code": course_info.course_code,
                "course_name": course_info.course_name,
            }
            result = connection.execute(
                sqlalchemy.text(
                    """
                    INSERT INTO course_subscriptions (canvas_user_id, canvas_course_id, course_code, course_name, is_active)
                    VALUES (:canvas_user_id, :canvas_course_id, :course_code, :course_name, TRUE)
                    ON CONFLICT (canvas_user_id, canvas_course_id) DO UPDATE SET
                        is_active = TRUE,
                        subscribed_at = CURRENT_TIMESTAMP
                    RETURNING id, is_active
                    """
                ),
                params,
            )

            subscription = result.fetchone()

            return CourseSubscriptionResponse(
                message="Successfully subscribed to course",
                subscription_id=subscription.id,
                canvas_course_id=course_id,
                course_name=course_info.course_name,
                course_code=course_info.course_code,
                canvas_user_id=canvas_user_id,
            )
    except sqlalchemy.exc.IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Already subscribed to this course",
        )
    except Exception as e:
        logger.error(f"Database error in subscribe_to_course: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create subscription",
        )


@router.delete(
    "/{canvas_course_id}",
    response_model=CourseUnsubscriptionResponse,
    summary="Unsubscribe from a course",
    description="Remove subscription from a Canvas course",
)
def unsubscribe_from_course(
    canvas_course_id: int,
    auth_info: Dict[str, Any] = Depends(verify_api_key),
):
    """
    Unsubscribe from a course.

    - **canvas_course_id**: The Canvas course ID to unsubscribe from
    - Returns confirmation details on success
    """
    canvas_user_id = auth_info["user_id"]
    try:
        with db.engine.begin() as connection:
            params = {
                "canvas_user_id": canvas_user_id,
                "canvas_course_id": canvas_course_id,
            }
            result = connection.execute(
                sqlalchemy.text(
                    """
                    UPDATE course_subscriptions
                    SET is_active = FALSE
                    WHERE canvas_user_id = :canvas_user_id
                    AND canvas_course_id = :canvas_course_id
                    AND is_active = TRUE
                    RETURNING canvas_user_id, canvas_course_id, course_name, course_code
                    """
                ),
                params,
            )

            subscription_data = result.fetchone()
            if not subscription_data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Active subscription not found",
                )

            return CourseUnsubscriptionResponse(
                message="Successfully unsubscribed from course",
                canvas_course_id=canvas_course_id,
                course_name=subscription_data.course_name,
                course_code=subscription_data.course_code,
                canvas_user_id=canvas_user_id,
            )
    except HTTPException:
        raise  # Re-raise HTTPExceptions as-is
    except Exception as e:
        logger.error(f"Database error in unsubscribe_from_course: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove subscription",
        )


@router.get("", response_model=List[Subscription])
def get_subscriptions(
    auth_info: Dict[str, Any] = Depends(verify_api_key),
):
    """
    Get all active course subscriptions.

    Returns a list of courses the user is subscribed to for notifications.
    """
    canvas_user_id = auth_info["user_id"]
    try:
        with db.engine.begin() as connection:
            params = {"canvas_user_id": canvas_user_id}
            result = connection.execute(
                sqlalchemy.text(
                    """
                    SELECT canvas_course_id, course_name, course_code
                    FROM course_subscriptions
                    WHERE is_active = TRUE AND canvas_user_id = :canvas_user_id
                    ORDER BY course_name
                    """
                ),
                params,
            ).all()

            return [
                Subscription(
                    canvas_course_id=sub.canvas_course_id,
                    course_name=sub.course_name,
                    course_code=sub.course_code,
                )
                for sub in result
            ]

    except Exception as e:
        logger.error(f"Database error in get_subscriptions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve subscriptions",
        )


def get_course_info(canvas_user_id: int, canvas_course_id: int):
    with db.engine.begin() as connection:
        result = connection.execute(
            sqlalchemy.text("""
                SELECT course_name, course_code
                FROM user_courses
                WHERE canvas_user_id = :user_id AND canvas_course_id = :course_id
            """),
            {"user_id": canvas_user_id, "course_id": canvas_course_id},
        ).first()
        return result
