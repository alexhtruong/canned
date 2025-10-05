from fastapi import APIRouter, HTTPException
from typing import List
from src.models.course import Course, Term
import src.database as db
import sqlalchemy

router = APIRouter(prefix="/courses", tags=["courses"])

@router.get("", response_model=List[Course])
async def get_courses(canvas_user_id: int = 1) -> List[Course]:
    """
    Get's the user's canvas courses from the local db
    """
    try:
        denormalized_courses = fetch_courses_from_db(canvas_user_id)
        if not denormalized_courses:
            return []
        
        normalized_courses = normalize_courses(denormalized_courses)
        return normalized_courses
    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve courses")    

def fetch_courses_from_db(canvas_user_id: int):
    with db.engine.begin() as connection:
        result = connection.execute(
            sqlalchemy.text("""
                SELECT canvas_course_id, course_name, course_code, term_id, term_name, term_start_at, is_completed
                FROM user_courses
                WHERE canvas_user_id = :canvas_user_id
            """),
            {"canvas_user_id": canvas_user_id}
        ).all()
        
        return result

def normalize_courses(courses) -> List[Course]:
    """Transform database rows into Course objects."""
    result = []
    
    for course in courses:
        term = None
        if course.term_id:
            term = Term(
                id=course.term_id,
                name=course.term_name,
                start_at=course.term_start_at
            )
        
        course_obj = Course(
            id=course.canvas_course_id,
            name=course.course_name,
            course_code=course.course_code,
            term=term
        )
        result.append(course_obj)
    
    return result