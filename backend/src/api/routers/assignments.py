from fastapi import APIRouter, HTTPException, Depends
from typing import Any, Dict, List

from pydantic import BaseModel
import sqlalchemy
from src.models.assignment import Assignment
from src.services.canvas_sync import get_assignments_for_active_courses
from src import database as db
from src.auth import verify_api_key
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/assignments", tags=["assignments"])


class SubmissionUpdateRequest(BaseModel):
    """Request model for updating submission status."""
    is_locally_complete: bool


class AssignmentServiceError(Exception):
    """Custom exception for assignment service operations."""

    pass


@router.get("")
def get_assignments(
    auth_info: Dict[str, any] = Depends(verify_api_key),
):
    canvas_user_id = auth_info["user_id"]
    assignments: List[Assignment] = get_assignments_for_active_courses(canvas_user_id)
    return assignments


@router.patch("/{assignment_id}/submission")
def update_assignment_submission(
    assignment_id: int,
    request: SubmissionUpdateRequest,
    auth_info: Dict[str, any] = Depends(verify_api_key),
) -> Dict[str, Any]:
    """
    Update assignment submission status (locally tracked, not synced to Canvas).

    Args:
        assignment_id: Canvas assignment ID
        request: Request containing is_locally_complete

    Returns:
        Dict with success message and updated assignment data

    Raises:
        HTTPException: 404 if assignment not found, 500 if update fails
    """
    canvas_user_id = auth_info["user_id"]
    try:
        with db.engine.begin() as connection:
            exists = connection.execute(
                sqlalchemy.text("""
                    SELECT canvas_assignment_id
                    FROM user_assignments
                    WHERE canvas_user_id = :user_id
                        AND canvas_assignment_id = :assignment_id
                """),
                {"user_id": canvas_user_id, "assignment_id": assignment_id},
            ).first()

            if not exists:
                logger.error(
                    f"Assignment {assignment_id} not found for user {canvas_user_id}"
                )
                raise AssignmentServiceError("Assignment not found")

            # Update or clear local completion status
            if request.is_locally_complete:
                connection.execute(
                    sqlalchemy.text("""
                        UPDATE user_submissions
                        SET is_locally_complete = 1,
                            locally_completed_at = CURRENT_TIMESTAMP
                        WHERE canvas_user_id = :user_id
                            AND canvas_assignment_id = :assignment_id
                    """),
                    {"user_id": canvas_user_id, "assignment_id": assignment_id},
                )
            else:
                # Allow unmarking as done
                connection.execute(
                    sqlalchemy.text("""
                        UPDATE user_submissions
                        SET is_locally_complete = 0,
                            locally_completed_at = NULL
                        WHERE canvas_user_id = :user_id
                            AND canvas_assignment_id = :assignment_id
                    """),
                    {"user_id": canvas_user_id, "assignment_id": assignment_id},
                )

            # Fetch updated assignment data
            result = connection.execute(
                sqlalchemy.text("""
                    SELECT
                        a.canvas_assignment_id as id,
                        a.assignment_name as name,
                        a.course_name,
                        a.due_at,
                        s.workflow_state,
                        s.is_locally_complete,
                        s.locally_completed_at
                    FROM user_assignments a
                    LEFT JOIN user_submissions s
                        ON a.canvas_assignment_id = s.canvas_assignment_id
                        AND a.canvas_user_id = s.canvas_user_id
                    WHERE a.canvas_user_id = :user_id
                      AND a.canvas_assignment_id = :assignment_id
                """),
                {"user_id": canvas_user_id, "assignment_id": assignment_id},
            ).first()

            logger.info(
                f"Marked assignment {assignment_id} as done for user {canvas_user_id}"
            )

            return {
                "id": result.id,
                "name": result.name,
                "course_name": result.course_name,
                "due_at": result.due_at,
                "workflow_state": result.workflow_state,
                "is_locally_complete": bool(result.is_locally_complete),
                "locally_completed_at": result.locally_completed_at,
            }
    except AssignmentServiceError as e:
        print(f"Failed to mark assignment {assignment_id} as done: {e}")
        raise HTTPException(
            status_code=404 if "not found" in str(e).lower() else 500,
            detail="Failed to update assignment",
        )
