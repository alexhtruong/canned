"""
Course-related models for Canvas API entities.
"""
from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class Term(BaseModel):
    """Represents a Canvas term (e.g., 'Fall Quarter 2023')."""
    id: int
    name: str    # "Fall Quarter 2023"
    start_at: datetime
    # Omitting: start_at, end_at, created_at, workflow_state, grading_period_group_id


class Course(BaseModel):
    """Represents a Canvas course."""
    id: int
    name: str = "Unnamed Course"
    course_code: str = "UNKNOWN"
    term: Optional[Term] = None