from fastapi import APIRouter, HTTPException
from src.services.canvas_sync import sync_user_courses, sync_user_assignments, CanvasAPIError, CanvasSyncError

router = APIRouter(prefix="/canvas", tags=["canvas"])

@router.post("/sync")
async def sync_canvas(canvas_user_id: int):
    try:
        sync_courses_result = sync_user_courses(canvas_user_id)
        sync_assignments_result = sync_user_assignments(canvas_user_id)
        
        return {
            "status": "success",
            "courses": sync_courses_result,
            "assignments": sync_assignments_result,
            "message": (
                f"Synced {sync_courses_result['synced']} courses and "
                f"{sync_assignments_result['synced']} assignments"
            )
        }
        
    except CanvasAPIError as e:
        # Canvas API is down or unreachable
        print(f"Canvas API error for user {canvas_user_id}: {e}")
        raise HTTPException(
            status_code=502,
            detail="Canvas API unavailable. Please try again later."
        )
        
    except CanvasSyncError as e:
        # Internal sync/processing error
        print(f"Sync error for user {canvas_user_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Sync operation failed. Please contact support."
        )
        
    except Exception as e:
        # Unexpected error
        print(f"Unexpected error syncing for user {canvas_user_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred during sync."
        )