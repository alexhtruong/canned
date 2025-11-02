from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from src.models.course import Course, Term
from src.auth import verify_api_key
import src.database as db
import sqlalchemy
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("", response_model=List[Course])
async def get_courses(
    auth_info: Dict[str, Any] = Depends(verify_api_key),
) -> List[Course]:
    """
    Get's the user's canvas courses from the local db
    """
    canvas_user_id = auth_info["user_id"]
    try:
        denormalized_courses = fetch_courses_from_db(canvas_user_id)
        if not denormalized_courses:
            return []

        normalized_courses = normalize_courses(denormalized_courses)
        return normalized_courses
    except Exception as e:
        logger.error(f"Database error fetching courses for user {canvas_user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve courses")


def fetch_courses_from_db(canvas_user_id: int):
    with db.engine.begin() as connection:
        result = connection.execute(
            sqlalchemy.text("""
                SELECT canvas_course_id, course_name, course_code, term_id, term_name, term_start_at, is_active, is_subscribed
                FROM user_courses
                WHERE canvas_user_id = :canvas_user_id
            """),
            {"canvas_user_id": canvas_user_id},
        ).all()

        return result


def normalize_courses(courses) -> List[Course]:
    """Transform database rows into Course objects."""
    result = []

    for course in courses:
        term = None
        if course.term_id:
            term = Term(
                id=course.term_id, name=course.term_name, start_at=course.term_start_at
            )

        course_obj = Course(
            id=course.canvas_course_id,
            name=course.course_name,
            course_code=course.course_code,
            term=term,
            is_subscribed=course.is_subscribed
        )
        result.append(course_obj)

    return result

def get_course_info(canvas_user_id: int, canvas_course_id: int):
    with db.engine.begin() as connection:
        result = connection.execute(
            sqlalchemy.text("""
                SELECT course_name, course_code, is_subscribed
                FROM user_courses
                WHERE canvas_user_id = :user_id AND canvas_course_id = :course_id
            """),
            {"user_id": canvas_user_id, "course_id": canvas_course_id},
        ).first()
        return result