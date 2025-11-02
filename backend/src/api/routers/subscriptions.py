from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Dict, Any
from pydantic import BaseModel
import sqlalchemy
import logging

from src.api.routers.courses import get_course_info
from src import database as db
from src.auth import verify_api_key
from src.models.subscription import Subscription

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/subscriptions",
    tags=["subscriptions"],
)


class ToggleSubscriptionRequest(BaseModel):
    is_subscribed: bool

class ToggleSubscriptionResponse(BaseModel):
    canvas_course_id: int
    is_subscribed: bool
    course_code: str
    course_name: str


@router.put("/courses/{course_id}")
def toggle_subscription(
    course_id: int,
    request: ToggleSubscriptionRequest,
    auth_info: Dict[str, Any] = Depends(verify_api_key),
):
    user_id = auth_info["user_id"]
    try:
        with db.engine.begin() as connection:
            course_info = get_course_info(user_id, course_id)
            if not course_info:
                raise HTTPException(404, "Course not found")
            
            connection.execute(
                sqlalchemy.text("""
                    UPDATE user_courses
                    SET is_subscribed = :is_subscribed
                    WHERE canvas_user_id = :canvas_user_id AND canvas_course_id = :canvas_course_id
                """),
                {
                    "canvas_user_id": user_id,
                    "canvas_course_id": course_id,
                    "is_subscribed": request.is_subscribed  
                }
            )
            
            connection.execute(
                sqlalchemy.text("""
                    INSERT INTO subscription_history (canvas_user_id, canvas_course_id, action)
                    VALUES (:canvas_user_id, :canvas_course_id, :action)
                """),
                {
                    "canvas_user_id": user_id,
                    "canvas_course_id": course_id,
                    "action": "subscribed" if request.is_subscribed else "unsubscribed"  
                }
            )
            
            return ToggleSubscriptionResponse(
                canvas_course_id=course_id,
                is_subscribed=request.is_subscribed,
                course_code=course_info.course_code,
                course_name=course_info.course_name
            )
            
    except Exception as e:
        logger.error(f"Error while trying to toggle course subscription: {e}")
        raise HTTPException(500, "Failed to toggle course subscription")


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
                    FROM user_courses
                    WHERE is_subscribed = TRUE AND canvas_user_id = :canvas_user_id
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

