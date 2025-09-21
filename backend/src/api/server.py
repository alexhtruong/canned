from fastapi import FastAPI, HTTPException
from starlette.middleware.cors import CORSMiddleware
import requests
from src.config import get_settings
from pydantic import BaseModel, Field
from typing import List, Tuple
import sqlalchemy
from src import database as db
from src.session import session

description = """
im canned
"""

app = FastAPI(
    title="Canned",
    description=description,
    version="0.0.1",
    terms_of_service="http://example.com/terms/",
    contact={
        "name": "Alex Truong",
        "email": "atruon68@calpoly.edu",
    }
)

# TODO: add prod links
origins = ["http://localhost", "http://localhost:8000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

settings = get_settings()

@app.get("/")
async def root():
    return {"message": "Welcome to Canned!"}

class Course(BaseModel):
    id: int
    uuid: str | None = None
    name: str = "Unnamed Course"
    course_code: str = "UNKNOWN"

async def fetch_canvas_courses() -> Tuple[List[dict], int]:
    """
    Gets user's entire collection of canvas courses.\n
    Returns a list of courses and the HTTP response status code
    """
    all_courses = []
    page = 1
    per_page = 100
    
    while True:
        params = {"page": page, "per_page": per_page}
        response = session.get(
            f"{settings.CANVAS_BASE_URL}/api/v1/courses",
            params=params,
            timeout=30
        )
        response.raise_for_status()
        courses_page = response.json()
        
        if not courses_page:
            break
            
        all_courses.extend(courses_page)
        
        link_header = response.headers.get('Link', '')
        if 'rel="next"' not in link_header:
            break
            
        page += 1
    
    return all_courses, response.status_code

async def get_current_canvas_user() -> dict:
    """Get the user associated with the current PAT"""
    try:
        response = session.get(f"{settings.CANVAS_BASE_URL}/api/v1/users/self")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid Canvas API token")
        elif e.response.status_code == 403:
            raise HTTPException(status_code=403, detail="Access denied to Canvas API")
        else:
            raise HTTPException(status_code=500, detail=f"Canvas API error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get current user: {str(e)}")

@app.get("/courses", response_model=List[Course])
async def get_courses() -> List[Course]:
    """
    Get's the user's canvas courses and formats data appropriately
    """
    try:
        raw_courses, response = await fetch_canvas_courses()
        
        course_objects = []
        for course in raw_courses:
            id = course.get("id")
            uuid = course.get("uuid")
            name = course.get("name")
            course_code = course.get("course_code")
            
            if not (uuid and name and course_code):
                continue
                
            course_obj = Course(id=id, uuid=uuid, name=name, course_code=course_code)
            course_objects.append(course_obj)
        
        return course_objects
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Canvas API request timed out")
    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=503, detail="Unable to connect to Canvas API")
    except requests.exceptions.HTTPError as e:
        if hasattr(e, 'response') and e.response is not None:
            status_code = e.response.status_code
            if status_code == 401:
                raise HTTPException(status_code=401, detail="Invalid Canvas API token")
            elif status_code == 403:
                raise HTTPException(status_code=403, detail="Access denied to Canvas API")
            else:
                raise HTTPException(status_code=status_code, detail=f"Canvas API error: {e}")
        else:
            raise HTTPException(status_code=500, detail=f"HTTP error: {e}")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Request failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}") 
    
class CourseSubscriptionRequest(BaseModel):
    canvas_course_id: int = Field(gt=0, description="Canvas course ID to subscribe to")

class CourseSubscriptionResponse(BaseModel):
    message: str
    subscription_id: int
    canvas_course_id: int
    course_name: str
    course_code: str
    canvas_user_id: int

@app.post("/users/{canvas_user_id}/subscriptions", response_model=CourseSubscriptionResponse)
async def subscribe_course(canvas_user_id: int, subscription_request: CourseSubscriptionRequest):
    """
    Subscribes a user to a specific course given its id(currently only adds it to db table)
    """
    raw_courses, _ = await fetch_canvas_courses()
    course_data = next((course for course in raw_courses if course["id"] == subscription_request.canvas_course_id), None)
    if not course_data:
        raise HTTPException(status_code=400, detail="Course not found or you are not enrolled")
    
    # Skip user validation - its just me
    # user = await get_current_canvas_user()  # Remove this
    # if not user:  # Remove this
    #     raise HTTPException(status_code=401, detail="Unable to identify user")  # Remove this
    
    course_name = course_data.get("name")
    course_code = course_data.get("course_code")
    if not (course_name or course_code):
        raise HTTPException(status_code=400, detail="Course data incomplete")

    try:
        with db.engine.begin() as connection:
            params = {
                "canvas_user_id": canvas_user_id,
                "canvas_course_id": subscription_request.canvas_course_id,
                "course_code": course_code,
                "course_name": course_name,
            }
            result = connection.execute(
                sqlalchemy.text(
                    """
                    INSERT INTO course_subscriptions (canvas_user_id, canvas_course_id, course_code, course_name, is_active)
                    VALUES (:canvas_user_id, :canvas_course_id, :course_code, :course_name, TRUE)
                    ON CONFLICT (canvas_user_id, canvas_course_id) DO UPDATE SET 
                        is_active = TRUE,
                        subscribed_at = CURRENT_TIMESTAMP
                    RETURNING id, is_active
                    """
                ), 
                params
            )

            subscription = result.fetchone()

            return CourseSubscriptionResponse(
                message="Subscription confirmed",  # More neutral - works for both create and update
                subscription_id=subscription.id,
                canvas_course_id=subscription_request.canvas_course_id,
                course_name=course_name,
                course_code=course_code,
                canvas_user_id=canvas_user_id
            )
    except sqlalchemy.exc.IntegrityError:
        raise HTTPException(status_code=409, detail="Already subscribed to this course")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


class CourseUnsubscriptionResponse(BaseModel):
    message: str
    canvas_course_id: int
    course_name: str
    course_code: str
    canvas_user_id: int

@app.patch("/users/{canvas_user_id}/subscriptions/{canvas_course_id}", response_model=CourseUnsubscriptionResponse)
def unsubscribe_course(canvas_user_id: int, canvas_course_id: int):
    # user = await get_current_canvas_user()
    # if not user:
    #     raise HTTPException(status_code=401, detail="Unable to identify user")
    
    try:
        with db.engine.begin() as connection:
            params = {
                "canvas_user_id": canvas_user_id,
                "canvas_course_id": canvas_course_id
            }
            result = connection.execute(
                sqlalchemy.text(
                    """
                    UPDATE course_subscriptions
                    SET is_active = FALSE
                    WHERE canvas_user_id = :canvas_user_id 
                    AND canvas_course_id = :canvas_course_id
                    AND is_active = TRUE
                    RETURNING canvas_user_id, canvas_course_id, course_name, course_code
                    """
                ),
                params
            )

            subscription_data = result.fetchone()
            if not subscription_data:     
                raise HTTPException(status_code=404, detail="Active subscription not found")

            return CourseUnsubscriptionResponse(
                message="Unsubscription confirmed",
                canvas_course_id=canvas_course_id,
                course_name=subscription_data.course_name,
                course_code=subscription_data.course_code,
                canvas_user_id=canvas_user_id
            )
    except HTTPException:
        raise  # Re-raise HTTPExceptions as-is
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

class Subscription(BaseModel):
    canvas_course_id: int
    course_name: str
    course_code: str

@app.get("/users/{canvas_user_id}/subscriptions", response_model=List[Subscription])
def get_course_subscriptions(canvas_user_id: int):
    """
    Gets all of users' subscribed courses
    """
    try:
        with db.engine.begin() as connection:
            params = {
                "canvas_user_id": canvas_user_id
            }
            result = connection.execute(
                sqlalchemy.text(
                    """
                    SELECT canvas_course_id, course_name, course_code
                    FROM course_subscriptions
                    WHERE is_active = TRUE AND canvas_user_id = :canvas_user_id
                    """
                ),
                params
            ).all()

            if not result:
                return []
            
            subscriptions = [
                Subscription(
                    canvas_course_id=subscription.canvas_course_id,
                    course_name=subscription.course_name,
                    course_code=subscription.course_code
                )
                for subscription in result
            ]

            return subscriptions
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
