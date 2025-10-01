"""
User-related models for the application.
"""
from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class User(BaseModel):
    """Represents a user in the system."""
    id: int
    canvas_id: int
    name: str
    phone_number: Optional[str] = None
    created_at: datetime


class UserResponse(BaseModel):
    """Response model for user operations."""
    id: int
    canvas_id: int
    name: str
    phone_number: Optional[str] = None