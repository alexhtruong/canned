from fastapi import APIRouter, HTTPException
from typing import List

import requests
from backend.src.utils.canvas import fetch_canvas_courses
from src.models.course import Course, Term

router = APIRouter(prefix="/courses", tags=["courses"])

@router.get("", response_model=List[Course])
async def get_courses() -> List[Course]:
    """
    Get's the user's canvas courses and formats data appropriately
    """
    try:
        raw_courses, response_status = fetch_canvas_courses()
        
        course_objects = []
        for course in raw_courses:
            try:
                # Check required fields exist (allow falsy values except None)
                if course.get("id") is None or course.get("name") is None:
                    print(f"Skipping course - missing required fields: {course.get('id', 'NO_ID')}")
                    continue

                # Extract and validate term data
                term_obj = None
                if course.get("term"):
                    term_data = course["term"]
                    if term_data.get("id") and term_data.get("name") and term_data.get("start_at"):
                        term_obj = Term(
                            id=term_data["id"],
                            name=term_data["name"],
                            start_at=term_data["start_at"]
                        )

                # Create course object with explicit field mapping
                course_obj = Course(
                    id=course["id"],
                    name=course["name"],
                    course_code=course.get("course_code", "UNKNOWN"),
                    term=term_obj
                )
                course_objects.append(course_obj)
                
            except Exception as e:
                print(f"Error processing course {course.get('id', 'unknown')}: {e}")
                continue  # Skip this course but continue with others
        
        return course_objects
    except requests.exceptions.RequestException as e:
        return HTTPException(status_code=500, detail=f"Request failed: {str(e)}")
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}") 