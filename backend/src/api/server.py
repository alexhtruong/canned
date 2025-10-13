from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from src.api.routers import assignments
from src.config import get_settings
from src.api.routers import courses, subscriptions, canvas
import html2text

description = """
im canned
"""

app = FastAPI(
    title="Canned",
    description=description,
    version="0.0.1",
    contact={
        "name": "Alex Truong",
        "email": "atruon68@calpoly.edu",
    }
)

# TODO: add prod links
origins = [
    "http://localhost",
    "http://localhost:3000",  # Next.js default dev port
    "http://localhost:8000",
    "http://127.0.0.1:3000",  # Alternative localhost format
    "http://127.0.0.1:8000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

settings = get_settings()

@app.get("/")
async def root():
    return {"message": "Welcome to Canned!"}

class TextRequest(BaseModel):
    text: str

@app.post("/test")
async def test(
    request: TextRequest,
):
    # Configure html2text for clean output
        h = html2text.HTML2Text()
        h.ignore_links = False  # Keep URLs (convert to Markdown)
        h.ignore_images = True  # Remove images
        h.ignore_emphasis = True  # Keep bold/italic as Markdown
        h.body_width = 0  # Don't wrap lines
        h.unicode_snob = True  # Use Unicode instead of ASCII
        
        # Convert HTML to Markdown-style text
        text = h.handle(request.text)
        
        # Clean up excessive newlines
        text = " ".join(text.split())
        text = text.strip()
        
        return text if text else None

app.include_router(courses.router)
app.include_router(subscriptions.router)
app.include_router(canvas.router)
app.include_router(assignments.router)