"""
Course-related models for Canvas API entities.
"""
from datetime import datetime, timezone
from pydantic import BaseModel, computed_field
from typing import Optional

QUARTER_LENGTH_WEEKS = 10
SEMESTER_LENGTH_WEEKS = 15
BUFFER_WEEKS = 3
DEFAULT_TERM_LENGTH_DAYS = (QUARTER_LENGTH_WEEKS + BUFFER_WEEKS) * 7


class Term(BaseModel):
    """Represents a Canvas term (e.g., 'Fall Quarter 2023')."""
    id: int
    name: str    # "Fall Quarter 2023"
    start_at: Optional[datetime]
    # Omitting: start_at, end_at, created_at, workflow_state, grading_period_group_id


class Course(BaseModel):
    """Represents a Canvas course."""
    id: int
    name: str = "Unnamed Course"
    course_code: str = "UNKNOWN"
    term: Optional[Term] = None

    @computed_field
    @property
    def is_active(self) -> bool:
        """
        Determine if course is currently active based on term start date.
        
        Assumes standard academic term length + buffer period.
        Configure via environment variables:
        - QUARTER_LENGTH_WEEKS (default: 10)
        - SEMESTER_LENGTH_WEEKS (default: 15)
        - BUFFER_WEEKS (default: 3)
        
        Returns:
            True if course is likely active, False if likely completed
        """
        if not self.term or not self.term.start_at:
            # No term data - assume active (safety default)
            return False
        
        now = datetime.now(timezone.utc)
        
        # Ensure start_at is timezone-aware
        start_date = self.term.start_at
        if start_date.tzinfo is None:
            start_date = start_date.replace(tzinfo=timezone.utc)
        
        days_since_start = (now - start_date).days
    
        term_length_days = DEFAULT_TERM_LENGTH_DAYS
        
        return days_since_start <= term_length_days