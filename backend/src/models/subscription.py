"""
Subscription-related models for course subscription functionality.
"""
from pydantic import BaseModel

class Subscription(BaseModel):
    """Model representing a user's active course subscription."""
    canvas_course_id: int
    course_name: str
    course_code: str