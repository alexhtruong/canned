from fastapi import APIRouter, HTTPException, status
from typing import List
import sqlalchemy

from backend.src.utils.canvas import fetch_canvas_courses
from src import database as db
from src.models.subscription import (
    CourseSubscriptionRequest,
    CourseSubscriptionResponse, 
    CourseUnsubscriptionResponse,
    Subscription
)

router = APIRouter(
    prefix="/subscriptions",
    tags=["subscriptions"],
)


@router.post(
    "",
    response_model=CourseSubscriptionResponse,
    summary="Subscribe to a course",
    description="Subscribe the current user to a Canvas course for notifications"
)
async def subscribe_to_course(
    subscription_request: CourseSubscriptionRequest,
    canvas_user_id: int = 1  # TODO: Get from authentication context
):
    """
    Subscribe to a course for notifications.
    
    - **canvas_course_id**: The Canvas course ID to subscribe to
    - Returns subscription details on success
    """
    # Validate course exists and user has access
    raw_courses, _ = fetch_canvas_courses()
    course_data = next(
        (course for course in raw_courses 
         if course["id"] == subscription_request.canvas_course_id), 
        None
    )
    if not course_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Course not found or you are not enrolled"
        )
    
    course_name = course_data.get("name")
    course_code = course_data.get("course_code")
    if not (course_name or course_code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Course data incomplete"
        )

    try:
        with db.engine.begin() as connection:
            params = {
                "canvas_user_id": canvas_user_id,
                "canvas_course_id": subscription_request.canvas_course_id,
                "course_code": course_code,
                "course_name": course_name,
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
                params
            )

            subscription = result.fetchone()

            return CourseSubscriptionResponse(
                message="Successfully subscribed to course",
                subscription_id=subscription.id,
                canvas_course_id=subscription_request.canvas_course_id,
                course_name=course_name,
                course_code=course_code,
                canvas_user_id=canvas_user_id
            )
    except sqlalchemy.exc.IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Already subscribed to this course"
        )
    except Exception as e:
        print(f"Database error in subscribe_to_course: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create subscription"
        )


@router.delete(
    "/{canvas_course_id}",
    response_model=CourseUnsubscriptionResponse,
    summary="Unsubscribe from a course",
    description="Remove subscription from a Canvas course"
)
def unsubscribe_from_course(
    canvas_course_id: int,
    canvas_user_id: int = 1  # TODO: Get from authentication context
):
    """
    Unsubscribe from a course.
    
    - **canvas_course_id**: The Canvas course ID to unsubscribe from
    - Returns confirmation details on success
    """
    try:
        with db.engine.begin() as connection:
            params = {
                "canvas_user_id": canvas_user_id,
                "canvas_course_id": canvas_course_id
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
                params
            )

            subscription_data = result.fetchone()
            if not subscription_data:     
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Active subscription not found"
                )

            return CourseUnsubscriptionResponse(
                message="Successfully unsubscribed from course",
                canvas_course_id=canvas_course_id,
                course_name=subscription_data.course_name,
                course_code=subscription_data.course_code,
                canvas_user_id=canvas_user_id
            )
    except HTTPException:
        raise  # Re-raise HTTPExceptions as-is
    except Exception as e:
        print(f"Database error in unsubscribe_from_course: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove subscription"
        )


@router.get(
    "",
    response_model=List[Subscription],
    summary="Get active subscriptions",
    description="Retrieve all active course subscriptions for the current user"
)
def get_subscriptions(
    canvas_user_id: int = 1  # TODO: Get from authentication context
):
    """
    Get all active course subscriptions.
    
    Returns a list of courses the user is subscribed to for notifications.
    """
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
                params
            ).all()

            return [
                Subscription(
                    canvas_course_id=sub.canvas_course_id,
                    course_name=sub.course_name,
                    course_code=sub.course_code
                )
                for sub in result
            ]
        
    except Exception as e:
        print(f"Database error in get_subscriptions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve subscriptions"
        )