"""
Canvas synchronization service for fetching and processing Canvas data.

This service handles the transformation of raw Canvas API data into
structured objects that the application can use.
"""
from typing import List, Optional, Dict, Any
import requests
from src.utils.canvas import fetch_canvas_courses, fetch_canvas_assignments_for_class
from src.utils.text import strip_html_to_plaintext
from src.models.course import Course, Term
from src.models.assignment import Submission, Assignment
import sqlalchemy
from src import database as db

class CanvasAPIError(Exception):
    """Canvas API request failed."""
    pass

class CanvasSyncError(Exception):
    """Data processing failed."""
    pass

# TODO: normalize the course_name into actual name and course-tag in db schema(gen chem vs CHEM-124)
# TODO: when term ends, remove rows? or just label as disabled?
def sync_user_assignments(canvas_user_id: int) -> Dict[str, Any]:
    """
    Sync user's assignments from Canvas API to database.
    
    Args:
        canvas_user_id: Canvas user ID
        
    Returns:
        Dict with sync statistics (synced count, total)
        
    Raises:
        CanvasSyncError: If sync operation fails
    """
    try:
        assignments = sync_assignments_for_active_courses(canvas_user_id)
        if not assignments:
            print("No assignments found to sync")
            return {"synced": 0, "message": "No assignments found"}

        synced_count = bulk_upsert_assignments(canvas_user_id, assignments)
        print(f"Successfully synced {synced_count} assignments")
        return {"synced": synced_count, "total": len(assignments)}
    except (CanvasAPIError, CanvasSyncError):
        raise
    except Exception as e:
        print(f"Canvas sync failed: {e}")
        raise CanvasSyncError("Sync failed")
    
def bulk_upsert_assignments(canvas_user_id: int, assignments: List[Assignment]) -> int:
    assignment_records = [
        {
            "canvas_user_id": canvas_user_id,
            "canvas_assignment_id": assignment.id,
            "canvas_course_id": assignment.course_id,
            "course_name": assignment.course_name,
            "assignment_name": assignment.name,
            "graded": assignment.graded,
            "description": assignment.description,
            "html_url": assignment.html_url,
            "points_possible": assignment.points_possible,
            "due_at": assignment.due_at,
            "grading_type": assignment.grading_type
        }
        for assignment in assignments
    ]
    submission_records = [
        {
            "canvas_user_id": canvas_user_id,
            "canvas_submission_id": assignment.submission.id,
            "canvas_assignment_id": assignment.id,
            "workflow_state": assignment.submission.workflow_state,
            "score": assignment.submission.score,
            "grade": assignment.submission.grade,
            "submitted_at": assignment.submission.submitted_at,
            "late": assignment.submission.late,
            "missing": assignment.submission.missing
        }
        for assignment in assignments
    ]

    with db.engine.begin() as connection:
        # Upsert assignments
        connection.execute(
            sqlalchemy.text("""
                INSERT OR REPLACE INTO user_assignments 
                (canvas_user_id, canvas_assignment_id, canvas_course_id, course_name,
                 assignment_name, graded, description, html_url, points_possible, 
                 due_at, grading_type)
                VALUES (:canvas_user_id, :canvas_assignment_id, :canvas_course_id, :course_name,
                        :assignment_name, :graded, :description, :html_url, :points_possible,
                        :due_at, :grading_type)
            """),
            assignment_records
        )
        
        # Upsert submissions
        connection.execute(
            sqlalchemy.text("""
                INSERT OR REPLACE INTO user_submissions 
                (canvas_user_id, canvas_submission_id, canvas_assignment_id,
                 workflow_state, score, grade, submitted_at, late, missing)
                VALUES (:canvas_user_id, :canvas_submission_id, :canvas_assignment_id,
                        :workflow_state, :score, :grade, :submitted_at, :late, :missing)
            """),
            submission_records
        )

    return len(assignment_records)


def get_assignments_for_active_courses(canvas_user_id: int) -> List[Assignment]:
    """
    Get assignments for all active courses from database cache.
    
    This function ONLY reads from the database. Use sync_user_assignments()
    to fetch fresh data from Canvas API.
    
    Args:
        canvas_user_id: Canvas user ID
        
    Returns:
        List of Assignment objects from database
        
    Raises:
        CanvasSyncError: If database query fails
    """
    try:
        with db.engine.begin() as connection:
            # Query assignments with their submissions for active courses
            results = connection.execute(
                sqlalchemy.text("""
                    SELECT 
                        a.canvas_assignment_id,
                        a.canvas_course_id,
                        a.course_name,
                        a.assignment_name,
                        a.graded,
                        a.description,
                        a.html_url,
                        a.points_possible,
                        a.due_at,
                        a.grading_type,
                        s.canvas_submission_id,
                        s.workflow_state,
                        s.score,
                        s.grade,
                        s.submitted_at,
                        s.late,
                        s.missing
                    FROM user_assignments a
                    INNER JOIN user_courses c 
                        ON a.canvas_course_id = c.canvas_course_id 
                        AND a.canvas_user_id = c.canvas_user_id
                    LEFT JOIN user_submissions s 
                        ON a.canvas_assignment_id = s.canvas_assignment_id
                        AND a.canvas_user_id = s.canvas_user_id
                    WHERE a.canvas_user_id = :user_id
                      AND c.is_active = 1
                """),
                {"user_id": canvas_user_id}
            ).all()
        
        if not results:
            print(f"No assignments found in database for user {canvas_user_id}")
            return []
        
        # Convert database rows to Assignment objects
        assignments = []
        for row in results:
            submission = Submission(
                id=row.canvas_submission_id,
                assignment_id=row.canvas_assignment_id,
                score=row.score,
                grade=row.grade,
                submitted_at=row.submitted_at,
                workflow_state=row.workflow_state or "unsubmitted",
                late=row.late or False,
                missing=row.missing or False
            )
            
            assignment = Assignment(
                id=row.canvas_assignment_id,
                course_id=row.canvas_course_id,
                course_name=row.course_name,
                name=row.assignment_name,
                submission=submission,
                graded=row.graded,
                html_url=row.html_url,
                description=row.description,
                points_possible=row.points_possible,
                due_at=row.due_at,
                grading_type=row.grading_type
            )
            assignments.append(assignment)
        
        print(f"Retrieved {len(assignments)} assignments from database for user {canvas_user_id}")
        return assignments
        
    except Exception as e:
        print(f"Failed to fetch assignments from database for user {canvas_user_id}: {e}")
        raise CanvasSyncError("Failed to fetch assignments from database")

def _fetch_assignments_for_course(course_id: int, course_name: str) -> List[Assignment]:
    """
    Fetch assignments for a single course from Canvas API (internal helper).
    
    Args:
        course_id: Canvas course ID
        course_name: Course name for assignment objects
        
    Returns:
        List of Assignment objects from Canvas API
        
    Raises:
        CanvasAPIError: If Canvas API request fails
        CanvasSyncError: If data processing fails
    """
    try:
        assignments, response_status = fetch_canvas_assignments_for_class(course_id)
        return process_raw_assignments(assignments, course_name)
    except requests.exceptions.RequestException as e:
        print(f"Canvas API request failed for course {course_id}: {e}")
        raise CanvasAPIError("Failed to get assignments from Canvas")
    except Exception as e:
        print(f"Unexpected error processing assignments for course {course_id}: {e}")
        raise CanvasSyncError("Failed to process assignments")

def sync_assignments_for_active_courses(canvas_user_id: int) -> List[Assignment]:
    """
    Fetch assignments for all active courses from Canvas API.
    
    This function ONLY syncs from Canvas API. Use get_assignments_for_active_courses()
    to read from database cache.
    
    Args:
        canvas_user_id: Canvas user ID
        
    Returns:
        List of Assignment objects fetched from Canvas API
        
    Raises:
        CanvasSyncError: If sync operation fails
    """
    try:
        with db.engine.begin() as connection:
            active_courses = connection.execute(
                sqlalchemy.text("""
                    SELECT canvas_course_id, course_name
                    FROM user_courses
                    WHERE canvas_user_id = :user_id
                      AND is_active = 1
                """),
                {"user_id": canvas_user_id}
            ).all()
        
        if not active_courses:
            print(f"No active courses found for user {canvas_user_id}")
            return []
        
        # Fetch assignments from Canvas API for each active course
        all_assignments = []
        for course in active_courses:
            try:
                course_id = course.canvas_course_id
                course_name = course.course_name
                assignments = _fetch_assignments_for_course(course_id, course_name)
                all_assignments.extend(assignments)
            except CanvasAPIError as e:
                print(f"Failed to fetch assignments for course {course_id}: {e}")
                continue
        
        return all_assignments
        
    except Exception as e:
        print(f"Unexpected error fetching assignments for user {canvas_user_id}: {e}")
        raise CanvasSyncError("Failed to fetch assignments for active courses")

def process_raw_assignments(raw_assignments: List[Dict[str, Any]], course_name: str) -> List[Assignment]:
    assignment_objects = []

    for assignment_data in raw_assignments:
        assignment_obj = create_assignment_from_data(assignment_data, course_name)
        if assignment_obj:
            assignment_objects.append(assignment_obj)
    
    return assignment_objects


def is_valid_submission_data(submission_data: Dict[str, Any]) -> bool:
    required_fields = ["id", "assignment_id", "workflow_state"]
    return all(submission_data.get(field) is not None for field in required_fields)


def create_submission_from_data(submission_data: Dict[str, Any]) -> Optional[Submission]:
    if not submission_data:
        return None
        
    if not is_valid_submission_data(submission_data):
        print(f"Skipping submission {submission_data.get('id', 'UNKNOWN_ID')} - missing required fields")
        return None
    
    try:
        return Submission(
            id=submission_data["id"],
            assignment_id=submission_data["assignment_id"],
            score=submission_data.get("score"),
            grade=submission_data.get("grade"),
            submitted_at=submission_data.get("submitted_at"),
            workflow_state=submission_data["workflow_state"],
            late=submission_data.get("late", False),
            missing=submission_data.get("missing", False)
        )
    except Exception as e:
        print(f"Error creating submission object: {e}")
        return None


def is_valid_assignment_data(assignment_data: Dict[str, Any]) -> bool:
    required_fields = ["id", "course_id", "name", "html_url", "submission", "submission_types"]
    return all(assignment_data.get(field) is not None for field in required_fields)


def create_assignment_from_data(assignment_data: Dict[str, Any], course_name: str) -> Optional[Assignment]:
    """
    Create an Assignment object from Canvas API assignment data.
    
    Args:
        assignment_data: Raw assignment data from Canvas API
        course_name: Name of the course (e.g., "General Chemistry")
        
    Returns:
        Assignment object or None if validation fails
    """
    if not assignment_data:
        return None

    if not is_valid_assignment_data(assignment_data):
        print(f"Skipping assignment {assignment_data.get('id', 'UNKNOWN_ID')} - missing required fields")
        return None
    
    try:
        submission_obj = create_submission_from_data(assignment_data["submission"])

        if not submission_obj:
            return None
        
        submission_types: List[str] = assignment_data.get("submission_types", [])
        graded = "not_graded" not in submission_types

        description = assignment_data.get("description")
        cleaned_description = strip_html_to_plaintext(description)
        return Assignment(
            id=assignment_data["id"],
            course_id=assignment_data["course_id"],
            course_name=course_name,
            name=assignment_data["name"],
            submission=submission_obj,
            graded=graded,
            html_url=assignment_data["html_url"],
            description=cleaned_description,
            points_possible=assignment_data.get("points_possible"),
            due_at=assignment_data.get("due_at"),
            grading_type=assignment_data.get("grading_type")
        )
    except Exception as e:
        print(f"Error creating assignment object for {assignment_data.get('id', 'unknown')}: {e}")
        return None


def sync_user_courses(canvas_user_id: int) -> Dict[str, Any]:
    """
    Sync user's Canvas courses from Canvas API to database.
    
    Args:
        canvas_user_id: Canvas user ID
        
    Returns:
        Dict with sync statistics (synced count, total)
        
    Raises:
        CanvasSyncError: If sync operation fails
    """
    try:
        courses = get_courses()
        
        if not courses:
            print("No courses found to sync")
            return {"synced": 0, "message": "No courses found"}
        
        synced_count = bulk_upsert_courses(canvas_user_id, courses)
            
        print(f"Successfully synced {synced_count} courses")
        return {"synced": synced_count, "total": len(courses)}
            
    except (CanvasAPIError, CanvasSyncError):
        raise
    except Exception as e:
        print(f"Canvas sync failed: {e}")
        raise CanvasSyncError("Sync failed")


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
            "is_active": course.is_active
        }
        for course in courses
    ]
    
    with db.engine.begin() as connection:
        # Build and execute bulk INSERT OR REPLACE for user_courses table
        connection.execute(
            sqlalchemy.text("""
                INSERT OR REPLACE INTO user_courses 
                (canvas_user_id, canvas_course_id, course_name, course_code, 
                    term_id, term_name, term_start_at, is_active)
                VALUES (:canvas_user_id, :canvas_course_id, :course_name, :course_code,
                        :term_id, :term_name, :term_start_at, :is_active)
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


def is_valid_term_data(term_data: Dict[str, Any]) -> bool:
    required_fields = ["id", "name", "start_at"]
    return all(term_data.get(field) is not None for field in required_fields)
    

def create_term_from_data(term_data: Dict[str, Any]) -> Optional[Term]:
    """
    Create a Term object from Canvas API term data.
    
    Single responsibility: term object creation.
    """
    if not term_data:
        return None
        
    if not is_valid_term_data(term_data):
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
    if not is_valid_course_data(course_data):
        print(f"Skipping course - missing required fields: {course_data.get('id', 'NO_ID')}")
        return None
    
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
        course_obj = create_course_from_data(course_data)
        if course_obj:
            course_objects.append(course_obj)
    
    return course_objects


def get_courses() -> List[Course]:
    """
    Fetch user's Canvas courses from Canvas API.
    
    This function fetches from Canvas API. To read from database cache,
    query user_courses table directly.
    
    Returns:
        List of Course objects from Canvas API
        
    Raises:
        CanvasAPIError: If Canvas API request fails
        CanvasSyncError: If data processing fails
    """
    try:
        raw_courses, response_status = fetch_canvas_courses()
        
        # Process into structured objects
        return process_raw_courses(raw_courses)
    except requests.exceptions.RequestException as e:
        raise CanvasAPIError("Failed to get courses from Canvas")
    except Exception as e:
        print(f"Unexpected error in get_courses: {e}")
        raise CanvasSyncError("Failed to process courses")