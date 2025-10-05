"""
Canvas synchronization service for fetching and processing Canvas data.

This service handles the transformation of raw Canvas API data into
structured objects that the application can use.
"""
from typing import List, Optional, Dict, Any

import requests
from src.utils.canvas import fetch_canvas_courses
from fastapi import HTTPException
from src.models.course import Course, Term
import sqlalchemy
from src import database as db



def sync_user_courses(canvas_user_id):
    """
    Syncs user's Canvas courses using efficient bulk operations.
    """
    try:
        courses = get_courses()
        
        if not courses:
            print("No courses found to sync")
            return {"synced": 0, "message": "No courses found"}
        
        synced_count = bulk_upsert_courses(canvas_user_id, courses)
            
        print(f"Successfully synced {synced_count} courses")
        return {"synced": synced_count, "total": len(courses)}
            
    except Exception as e:
        print(f"Canvas sync failed: {e}")
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")

def bulk_upsert_courses(canvas_user_id: int, courses: List[Course]) -> int:
    course_records = [
        {
            "canvas_user_id": canvas_user_id,
            "canvas_course_id": course.id,
            "course_name": course.name,
            "course_code": course.course_code,
            "term_id": course.term.id if course.term else None,
            "term_name": course.term.name if course.term else None,
            "term_start_at": course.term.start_at if course.term else None,
            "is_completed": True
        }
        for course in courses
    ]
    
    with db.engine.begin() as connection:
        # Build bulk INSERT OR REPLACE with
        connection.execute(
            sqlalchemy.text("""
                INSERT OR REPLACE INTO user_courses 
                (canvas_user_id, canvas_course_id, course_name, course_code, 
                    term_id, term_name, term_start_at, is_completed)
                VALUES (:canvas_user_id, :canvas_course_id, :course_name, :course_code,
                        :term_id, :term_name, :term_start_at, :is_completed)
            """),
            course_records  # Pass all records at once
        )
        
    return len(course_records)


def is_valid_course_data(course_data: Dict[str, Any]) -> bool:
    """
    Validate that course data has required fields.
    
    Single responsibility: validation only.
    """
    return (
        course_data.get("id") is not None and 
        course_data.get("name") is not None
    )


def create_term_from_data(term_data: Dict[str, Any]) -> Optional[Term]:
    """
    Create a Term object from Canvas API term data.
    
    Single responsibility: term object creation.
    """
    if not term_data:
        return None
        
    # Validate required term fields
    if not all([
        term_data.get("id"),
        term_data.get("name"), 
        term_data.get("start_at")
    ]):
        return None
    
    try:
        return Term(
            id=term_data["id"],
            name=term_data["name"],
            start_at=term_data["start_at"]
        )
    except Exception as e:
        print(f"Error creating term object: {e}")
        return None


def create_course_from_data(course_data: Dict[str, Any]) -> Optional[Course]:
    """
    Create a Course object from Canvas API course data.
    
    Single responsibility: course object creation.
    """
    try:
        term_obj = None
        if course_data.get("term"):
            term_obj = create_term_from_data(course_data["term"])
        
        return Course(
            id=course_data["id"],
            name=course_data["name"],
            course_code=course_data.get("course_code", "UNKNOWN"),
            term=term_obj
        )
    except Exception as e:
        print(f"Error creating course object for {course_data.get('id', 'unknown')}: {e}")
        return None


def process_raw_courses(raw_courses: List[Dict[str, Any]]) -> List[Course]:
    """
    Process a list of raw Canvas course data into Course objects.
    
    Single responsibility: batch processing with error handling.
    """
    course_objects = []
    
    for course_data in raw_courses:
        if not is_valid_course_data(course_data):
            print(f"Skipping course - missing required fields: {course_data.get('id', 'NO_ID')}")
            continue
        
        course_obj = create_course_from_data(course_data)
        if course_obj:
            course_objects.append(course_obj)
    
    return course_objects


def get_courses() -> List[Course]:
    """
    Get user's Canvas courses and format data appropriately.
    
    Single responsibility: orchestration and error handling.
    """
    try:
        raw_courses, response_status = fetch_canvas_courses()
        
        # Process into structured objects
        return process_raw_courses(raw_courses)
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Canvas API request failed: {str(e)}")
    except Exception as e:
        print(f"Unexpected error in get_courses: {e}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}") 
