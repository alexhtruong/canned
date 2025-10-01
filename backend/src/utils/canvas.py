from typing import List, Tuple

from fastapi import HTTPException
import requests
from src.session import session
from src.config import get_settings

settings = get_settings()

def fetch_canvas_paginated(endpoint: str, include_params: List[str]) -> Tuple[List[dict], int]:
    all_items = []
    page = 1
    per_page = 100
    final_status_code = 200

    while True:
        params = {
            "page": page,
            "per_page": per_page
        }

        if include_params:
            params["include[]"] = include_params
        
        try:
            response = session.get(
                f"{settings.CANVAS_BASE_URL}{endpoint}",
                params=params,
                timeout=10
            )
            response.raise_for_status()
            final_status_code = response.status_code
            
            items_page = response.json()
            if not items_page:
                break

            all_items.extend(items_page)

            link_header = response.headers.get('Link', '')
            if 'rel="next"' not in link_header:
                break
                
            page += 1
        except Exception as e:
            print(e)
            raise
    
    return all_items, final_status_code

def fetch_canvas_courses() -> Tuple[List[dict], int]:
    """
    Gets user's entire collection of canvas courses.\n
    Returns a list of courses and the HTTP response status code
    """
    try:
        all_courses, status_code = fetch_canvas_paginated(
            endpoint="/api/v1/courses", 
            include_params=["term"]
        )
        return all_courses, status_code
    except Exception as e:
        print(f"Error fetching Canvas courses: {e}")
        raise

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
        print(e)
        raise HTTPException(status_code=500, detail=f"Failed to get current user: {str(e)}")