"""
Subscription-related models for course subscription functionality.
"""
from pydantic import BaseModel, Field


class CourseSubscriptionRequest(BaseModel):
    """Request model for subscribing to a course."""
    canvas_user_id: int

class CourseSubscriptionResponse(BaseModel):
    """Response model for course subscription operations."""
    message: str
    subscription_id: int
    canvas_course_id: int
    course_name: str
    course_code: str
    canvas_user_id: int


class CourseUnsubscriptionResponse(BaseModel):
    """Response model for course unsubscription operations."""
    message: str
    canvas_course_id: int
    course_name: str
    course_code: str
    canvas_user_id: int


class Subscription(BaseModel):
    """Model representing a user's active course subscription."""
    canvas_course_id: int
    course_name: str
    course_code: str