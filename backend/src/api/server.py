from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.routers import assignments
from src.config import get_settings
from src.api.routers import courses, subscriptions, canvas

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

app.include_router(courses.router)
app.include_router(subscriptions.router)
app.include_router(canvas.router)
app.include_router(assignments.router)