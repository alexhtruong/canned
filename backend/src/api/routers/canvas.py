from fastapi import APIRouter, HTTPException
from src.services.canvas_sync import sync_user_courses

router = APIRouter(prefix="/canvas", tags=["canvas"])

@router.post("/sync")
async def sync_canvas_courses(canvas_user_id: int):
    try:
        result = sync_user_courses(canvas_user_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))