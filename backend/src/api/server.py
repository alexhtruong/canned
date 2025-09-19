from fastapi import FastAPI, HTTPException
from starlette.middleware.cors import CORSMiddleware
from src.config import get_settings
import requests
from pydantic import BaseModel
from typing import List

# Initialize env variables
settings = get_settings()

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

@app.get("/")
async def root():
    return {"message": "Welcome to Canned!"}

class Course(BaseModel):
    id: int
    uuid: str | None = None
    name: str = "Unnamed Course"
    course_code: str = "UNKNOWN"

@app.get("/courses", response_model=List[Course])
async def get_courses():
    try:
        # Canvas API requires authentication via Authorization header
        headers = {
            "Authorization": f"Bearer {settings.CANVAS_PAT}",
            "Content-Type": "application/json"
        }
        
        all_courses = []
        page = 1
        per_page = 100  # Maximum allowed by Canvas API
        
        while True:
            # Add pagination parameters
            params = {
                "page": page,
                "per_page": per_page
            }
            
            # Make the request to Canvas API
            response = requests.get(
                f"{settings.CANVAS_BASE_URL}/api/v1/courses",
                headers=headers,
                params=params,
                timeout=30
            )
            
            # Check if request was successful
            response.raise_for_status()
            
            courses_page = response.json()
            
            # If no courses returned, we've reached the end
            if not courses_page:
                break

            for course in courses_page:
                id = course.get("id")
                uuid = course.get("uuid")
                name = course.get("name")
                course_code = course.get("course_code")
                
                if not (uuid and name and course_code):
                    continue
                
                course_obj = Course(
                    id=id,
                    uuid=uuid,
                    name=name,
                    course_code=course_code
                )
                all_courses.append(course_obj)
            
            # Check if there are more pages using Link header
            link_header = response.headers.get('Link', '')
            relationship_value = 'rel="next"'
            if relationship_value not in link_header:
                break
                
            page += 1
        
        # will not be filtering out inactive/active classes here because my school/canvas doesn't properly update them
        return all_courses
        
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Canvas API request timed out")
    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=503, detail="Unable to connect to Canvas API")
    except requests.exceptions.HTTPError as e:
        if response.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid Canvas API token")
        elif response.status_code == 403:
            raise HTTPException(status_code=403, detail="Access denied to Canvas API")
        else:
            raise HTTPException(status_code=response.status_code, detail=f"Canvas API error: {e}")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Request failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}") 
    

@app.post("/courses/{course_id}/subscription")
async def course_subscribe(course_id: int):


# @app.delete("/courses/{course_id}/subscription")
# @app.get("/subscriptions")