from fastapi import APIRouter, HTTPException
from typing import List
from src.models.assignment import Assignment
from src.services.canvas_sync import get_assignments_for_active_courses

router = APIRouter(prefix="/assignments", tags=["assignments"])

@router.get("")
def get_assignments(canvas_user_id):
    assignments: List[Assignment] = get_assignments_for_active_courses(canvas_user_id)
    return assignments