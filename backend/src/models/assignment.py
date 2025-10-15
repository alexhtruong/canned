from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class Submission(BaseModel):
    id: Optional[int] = None
    assignment_id: int
    score: Optional[float] = None
    grade: Optional[str] = None
    submitted_at: Optional[datetime] = None
    workflow_state: str = "unsubmitted"
    late: bool = False
    missing: bool = False
    is_locally_complete: bool = False  # User marked as done locally


class Assignment(BaseModel):
    id: int
    course_id: int
    course_name: str
    name: str
    submission: Submission
    graded: bool = False
    description: Optional[str]
    points_possible: Optional[float]
    grading_type: Optional[str]   # points, not_graded, pass_fail, percent
    due_at: Optional[datetime]
    html_url: str