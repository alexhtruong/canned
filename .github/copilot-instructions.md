# GitHub Copilot Instructions for Canned Project

## Project Overview

**Canned** is a Canvas LMS integration application that syncs and manages course data. It's designed for personal use (2 users) and deployed as a serverless application.

**Tech Stack:**
- **Backend**: FastAPI (Python 3.11+)
- **Database**: SQLite-compatible (Turso for production, SQLite for local dev)
- **Migrations**: Alembic
- **Canvas Integration**: Canvas LMS REST API
- **Deployment**: Vercel (Serverless)
- **Package Manager**: UV

**Architecture Note**: The database acts as a **caching layer** for Canvas API data, not the source of truth.

---

## ⚠️ Critical Production Constraints

### Serverless Environment (Vercel)
- **No persistent file system** - Cannot use local SQLite in production
- **Stateless functions** - Each request may hit different container
- **Cold starts** - Optimize for fast initialization
- **Use Turso for production** - SQLite-compatible, serverless-native database

### Database Strategy
```python
# Local development
DATABASE_URL=sqlite:///./app.db

# Production (Vercel)
DATABASE_URL=libsql://your-db.turso.io?authToken=your-token

# Code works the same - just connection string changes
```

---

## Core Principles

### 1. Code Quality Standards

#### Structure & Organization
- **One responsibility per function** - Functions should do one thing well
- **Clear naming** - Use descriptive names (`fetch_courses_from_db`, not `get_data`)
- **Type hints required** - All function parameters and returns must have type hints
- **Docstrings mandatory** - All public functions need docstrings explaining purpose, args, and returns

```python
# ✅ GOOD
def fetch_courses_from_db(canvas_user_id: int) -> List[Row]:
    """
    Fetch course records from database for given user.
    
    Args:
        canvas_user_id: The Canvas user ID
        
    Returns:
        List of database rows containing course data
    """
    # implementation

# ❌ BAD
def get_data(id):
    # implementation
```

#### Error Handling
- **Use logging, not print()** - Import `logging` and use `logger.error()`, `logger.info()`
- **Never expose internal errors to clients** - Generic messages in HTTPException
- **Log with context** - Include user IDs, operation details
- **Use custom exceptions** - Create domain-specific exceptions (e.g., `CanvasSyncError`)

```python
# ✅ GOOD
import logging

logger = logging.getLogger(__name__)

class CanvasSyncError(Exception):
    """Custom exception for Canvas sync operations."""
    pass

try:
    result = sync_operation()
except Exception as e:
    logger.error(f"Sync failed for user {user_id}: {e}", exc_info=True)
    raise CanvasSyncError("Sync operation failed")

# In route layer
try:
    result = sync_user_courses(user_id, token)
    return result
except CanvasSyncError as e:
    raise HTTPException(status_code=500, detail="Sync failed")

# ❌ BAD
try:
    result = sync_operation()
except Exception as e:
    print(f"Error: {e}")  # Use logging!
    raise HTTPException(status_code=500, detail=f"Error: {str(e)}")  # Exposes internals!
```

---

### 2. Database Guidelines

#### SQL Query Standards
- **Always use parameterized queries** - Never string interpolation
- **Explicit column selection** - Don't use `SELECT *`
- **Transaction management** - Use `with db.engine.begin()`
- **Bulk operations** - Use executemany for multiple inserts/updates
- **Cache-first strategy** - Database is a cache, Canvas API is source of truth

```python
# ✅ GOOD
with db.engine.begin() as connection:
    result = connection.execute(
        sqlalchemy.text("""
            SELECT canvas_course_id, course_name, course_code
            FROM user_courses
            WHERE canvas_user_id = :canvas_user_id
        """),
        {"canvas_user_id": canvas_user_id}
    ).all()

# ❌ BAD
query = f"SELECT * FROM user_courses WHERE canvas_user_id = {canvas_user_id}"
result = connection.execute(query)
```

#### Accessing Query Results
- **Use dot notation** for column access: `row.column_name`
- **Check for empty results** with `if not results:` (returns `[]`, never `None`)
- **Column aliases** should match domain model field names when possible

```python
# ✅ GOOD
for course in courses:
    print(course.course_name)  # Dot notation
    
if not courses:
    return []  # Empty list is valid, not an error

# ❌ BAD
for course in courses:
    print(course['course_name'])  # Dictionary access (works but less clean)
    
if courses is None:  # Never happens with .all()
    raise HTTPException(404)
```

#### Database as Cache Pattern
```python
# 1. Try cache first
cached = fetch_from_db(user_id)
if cached and not is_stale(cached):
    return cached

# 2. Fetch from Canvas API
fresh_data = fetch_from_canvas(token)

# 3. Update cache
bulk_upsert(user_id, fresh_data)

# 4. Return fresh data
return fresh_data
```

---

### 3. API Route Standards

#### Endpoint Design
- **RESTful conventions** - Use proper HTTP methods
  - `GET` - Read data (idempotent, no side effects)
  - `POST` - Create or trigger actions (non-idempotent)
  - `PUT/PATCH` - Update existing data
  - `DELETE` - Remove data
- **Logical grouping** - Related endpoints in same router
- **Response models** - Always define `response_model` in decorators
- **Authentication required** - All endpoints must check auth

```python
# ✅ GOOD
@router.get("/courses", response_model=List[Course])
async def get_courses(
    api_key: str = Depends(verify_api_key)
) -> List[Course]:
    """Get user's courses from local database."""
    pass

@router.post("/canvas/sync")
async def sync_canvas_courses(
    api_key: str = Depends(verify_api_key)
):
    """Trigger sync operation with Canvas API."""
    pass

# ❌ BAD
@router.get("/sync")  # Should be POST
async def sync():  # No auth!
    pass
```

#### Route Organization
```
/courses        → Course data operations (read local DB cache)
/canvas/sync    → Canvas API integration (fetch & update cache)
/canvas/status  → Canvas connection status check
```

#### HTTP Status Codes
- **200 OK** - Successful GET/PUT/PATCH
- **201 Created** - Successful POST creating resource
- **204 No Content** - Successful DELETE
- **400 Bad Request** - Invalid input
- **401 Unauthorized** - Missing/invalid auth (critical for public deployment!)
- **404 Not Found** - Resource doesn't exist (NOT for empty lists)
- **500 Internal Server Error** - Server error (don't expose details)

```python
# ✅ GOOD - Empty list is valid
@router.get("/courses")
async def get_courses(api_key: str = Depends(verify_api_key)):
    courses = fetch_courses()
    if not courses:
        return []  # 200 OK with empty list
    return courses

# ❌ BAD
if not courses:
    raise HTTPException(status_code=404)  # Wrong! Empty ≠ Not Found
```

---

### 4. Security Requirements

#### Authentication (Public Deployment)
**Required**: Since app is publicly deployed, **every endpoint must be protected**.

```python
# filepath: /home/alex/canned/backend/src/auth.py
import os
from fastapi import Header, HTTPException

async def verify_api_key(x_api_key: str = Header(..., alias="X-API-Key")) -> str:
    """
    Verify API key from request header.
    
    Args:
        x_api_key: API key from X-API-Key header
        
    Returns:
        Validated API key
        
    Raises:
        HTTPException: 401 if key is invalid
    """
    allowed_keys = os.getenv("ALLOWED_API_KEYS", "").split(",")
    
    if not allowed_keys or x_api_key not in allowed_keys:
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing API key"
        )
    
    return x_api_key

# Usage in routes
from src.auth import verify_api_key

@router.get("/courses")
async def get_courses(
    api_key: str = Depends(verify_api_key)  # Required!
):
    pass
```

#### Sensitive Data Handling
- **Canvas tokens are passwords** - Must be encrypted at rest
- **Use HTTPS only** - All token transmission over encrypted connections (Vercel provides this)
- **Never log tokens** - Mask in logs: `token[:8]***`
- **Environment variables** - Store secrets in Vercel environment variables
- **Add to .gitignore** - `.env`, `*.db`, secret keys

```python
# ✅ GOOD
from cryptography.fernet import Fernet
import os

class TokenEncryption:
    def __init__(self):
        self.key = os.getenv('ENCRYPTION_KEY')
        if not self.key:
            raise ValueError("ENCRYPTION_KEY not set")
        self.cipher = Fernet(self.key.encode())
    
    def encrypt_token(self, token: str) -> bytes:
        return self.cipher.encrypt(token.encode())
    
    def decrypt_token(self, encrypted_token: bytes) -> str:
        return self.cipher.decrypt(encrypted_token).decode()

# Store in database
user.canvas_token_encrypted = encryption.encrypt_token(token)

# Log safely
logger.info(f"Using token: {token[:8]}***")

# ❌ BAD
user.canvas_token = token  # Plaintext storage
logger.info(f"Token: {token}")  # Logging sensitive data
```

#### Environment Variables
```bash
# .env (local dev only - gitignored)
DATABASE_URL=sqlite:///./app.db
ENCRYPTION_KEY=your-fernet-key-here
ALLOWED_API_KEYS=dev_key_12345

# Vercel Environment Variables (production)
DATABASE_URL=libsql://your-db.turso.io?authToken=xxx
ENCRYPTION_KEY=prod-encryption-key
ALLOWED_API_KEYS=prod_key_alex,prod_key_friend
CANVAS_API_URL=https://canvas.instructure.com
```

---

### 5. Service Layer Patterns

#### Separation of Concerns
- **Services** - Business logic, no HTTP concerns, custom exceptions
- **Routes** - HTTP handling, auth, delegate to services
- **Utils** - Pure functions, reusable helpers

```python
# ✅ GOOD - Service layer
class CanvasSyncError(Exception):
    """Custom exception for Canvas sync operations."""
    pass

def sync_user_courses(canvas_user_id: int, canvas_token: str) -> Dict[str, Any]:
    """
    Service function - core business logic.
    
    Args:
        canvas_user_id: Canvas user ID
        canvas_token: User's Canvas API token
        
    Returns:
        Dict with sync statistics
        
    Raises:
        CanvasSyncError: If sync fails
    """
    try:
        courses = fetch_courses_from_canvas(canvas_token)
        count = bulk_upsert_courses(canvas_user_id, courses)
        return {"synced": count, "total": len(courses)}
    except requests.RequestException as e:
        logger.error(f"Canvas API failed for user {canvas_user_id}: {e}")
        raise CanvasSyncError(f"Canvas API request failed")
    except Exception as e:
        logger.error(f"Unexpected sync error for user {canvas_user_id}: {e}")
        raise CanvasSyncError("Sync operation failed")

# Route layer - HTTP concerns only
@router.post("/sync")
async def sync_endpoint(
    request: SyncRequest,
    api_key: str = Depends(verify_api_key)
):
    """API endpoint - handles HTTP, delegates to service."""
    try:
        result = sync_user_courses(request.user_id, request.token)
        return result
    except CanvasSyncError as e:
        raise HTTPException(status_code=500, detail="Sync failed")

# ❌ BAD - HTTPException in service
def sync_user_courses():
    try:
        # ...
    except Exception as e:
        raise HTTPException(500, detail=str(e))  # Wrong layer!
```

#### Function Organization
```
src/
├── api/routers/        # HTTP endpoints (thin layer, auth checks)
├── services/           # Business logic (no HTTP, custom exceptions)
├── models/             # Data models (Pydantic)
├── auth.py             # Authentication utilities
├── database.py         # DB connection
└── utils/              # Helper functions
```

---

### 6. Code Style Guidelines

#### Naming Conventions
- **snake_case** - Functions, variables, modules
- **PascalCase** - Classes, Pydantic models
- **UPPER_CASE** - Constants
- **Private functions** - Prefix with `_` (e.g., `_bulk_upsert_courses`)

```python
# ✅ GOOD
MAX_RETRY_COUNT = 3

class Course(BaseModel):
    pass

def fetch_courses_from_db() -> List[Course]:
    pass

def _internal_helper():
    pass

# ❌ BAD
maxRetryCount = 3
class course:
    pass
def FetchCourses():
    pass
```

#### Import Organization
```python
# Standard library
import logging
import os
from typing import List, Optional, Dict, Any

# Third-party
import requests
import sqlalchemy
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel

# Local
from src.models.course import Course, Term
from src.database import get_db
from src.auth import verify_api_key
from src.services.canvas_sync import sync_user_courses
```

#### List Comprehensions vs Loops
- **Prefer comprehensions** for simple transformations
- **Use loops** when logic is complex or has multiple conditions/logging

```python
# ✅ GOOD - Simple transformation
courses = [
    Course(id=c.id, name=c.name)
    for c in db_courses
]

# ✅ GOOD - Complex logic with logging
courses = []
for course_data in raw_data:
    if not is_valid(course_data):
        logger.warning(f"Invalid course: {course_data.get('id')}")
        continue
    
    term = create_term(course_data.get('term'))
    course = Course(...)
    courses.append(course)
```

---

### 7. Database Migration Guidelines

#### Alembic Conventions
- **Descriptive revision messages** - `added_courses_table`, not `update`
- **Down migrations** - Always implement `downgrade()`
- **Constraints** - Add foreign keys, unique constraints, indexes
- **Column naming** - Use `snake_case`, be explicit
- **Test locally before deploying** - Migrations run in production on deploy

```python
# ✅ GOOD
def upgrade() -> None:
    """Add user_courses table with proper constraints."""
    op.create_table(
        "user_courses",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("canvas_user_id", sa.Integer, nullable=False),
        sa.Column("canvas_course_id", sa.Integer, nullable=False),
        sa.Column("course_name", sa.String, nullable=False),
        sa.Column("course_code", sa.String, nullable=False),
        sa.Column("term_id", sa.Integer),
        sa.Column("term_name", sa.String),
        sa.Column("term_start_at", sa.DateTime),
        sa.Column("is_active", sa.Boolean, default=True),
        sa.UniqueConstraint(
            "canvas_user_id", 
            "canvas_course_id", 
            name="unique_user_course_enrollment"
        ),
        sa.ForeignKeyConstraint(
            ["canvas_user_id"], 
            ["users.canvas_id"],
            name="fk_user_courses_canvas_user_id"
        )
    )

def downgrade() -> None:
    """Remove user_courses table."""
    op.drop_table("user_courses")
```

#### Column Type Guidelines
- **String** - Use `sa.String(length)` for limited text (or just `sa.String` for SQLite)
- **Integer** - For IDs, counts
- **DateTime** - For timestamps (store UTC)
- **Boolean** - For flags (`is_active`, `is_completed`)
- **LargeBinary** - For encrypted data (tokens)

---

### 8. Logging Standards (No pytest)

Since we're not using pytest, focus on **comprehensive logging** for debugging:

```python
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Usage patterns
logger.info(f"Syncing courses for user {user_id}")
logger.warning(f"No courses found for user {user_id}")
logger.error(f"Sync failed for user {user_id}: {error}", exc_info=True)

# Never log sensitive data
logger.info(f"Using Canvas token: {token[:8]}***")  # Masked
```

#### Logging Levels
- **DEBUG** - Detailed diagnostic info (dev only)
- **INFO** - General operational events (user actions, sync results)
- **WARNING** - Something unexpected but not critical (empty results, retries)
- **ERROR** - Operation failed, needs attention (API errors, DB failures)
- **CRITICAL** - System-level failures (startup failures, critical config missing)

---

## Common Patterns

### Bulk Database Operations
```python
# Always prepare data first, then single execute
course_records = [
    {
        "canvas_user_id": user_id,
        "canvas_course_id": course.id,
        "course_name": course.name,
        "course_code": course.course_code,
        "term_id": course.term.id if course.term else None,
        "term_name": course.term.name if course.term else None,
        "term_start_at": course.term.start_at if course.term else None,
        "is_active": True
    }
    for course in courses
]

with db.engine.begin() as connection:
    connection.execute(
        sqlalchemy.text("""
            INSERT OR REPLACE INTO user_courses 
            (canvas_user_id, canvas_course_id, course_name, course_code,
             term_id, term_name, term_start_at, is_active)
            VALUES (:canvas_user_id, :canvas_course_id, :course_name, :course_code,
                    :term_id, :term_name, :term_start_at, :is_active)
        """),
        course_records  # Single call with all data
    )
```

### Data Transformation Pipeline
```python
# Raw Data → Validation → Transformation → Domain Objects
def process_canvas_data(raw_data: List[Dict]) -> List[Course]:
    """
    Process raw Canvas API data into domain objects.
    
    Pipeline: validate → transform → filter nulls
    """
    # 1. Validate
    valid_data = [d for d in raw_data if is_valid_course_data(d)]
    
    # 2. Transform
    course_objects = [create_course_from_data(d) for d in valid_data]
    
    # 3. Filter nulls (from transformation failures)
    return [c for c in course_objects if c is not None]
```

### Authenticated Endpoint Pattern
```python
from fastapi import Depends
from src.auth import verify_api_key

@router.get("/protected-endpoint")
async def protected_route(
    api_key: str = Depends(verify_api_key)  # Always include for public deployment
):
    """
    Endpoint accessible only with valid API key.
    """
    # Your logic here
    pass
```

---

## Don'ts - Common Mistakes to Avoid

❌ **Never use ORM models** - This project uses raw SQL  
❌ **Never use `SELECT *`** - Always explicit columns  
❌ **Never log sensitive data** - Tokens, passwords, PII  
❌ **Never raise 404 for empty lists** - Return `[]`  
❌ **Never expose exception details to clients** - Generic error messages  
❌ **Never use string interpolation in SQL** - Always parameterized  
❌ **Never use `print()` for logging** - Use `logging` module  
❌ **Never commit `.env` files** - Add to `.gitignore`  
❌ **Never store tokens in plaintext** - Encrypt at rest  
❌ **Never use GET for state-changing operations** - Use POST  
❌ **Never deploy without authentication** - Public = requires auth on all endpoints  
❌ **Never use HTTPException in service layer** - Use custom exceptions  
❌ **Never assume file persistence on Vercel** - Database must be external  

---

## File Structure Guidelines

```
backend/
├── alembic/
│   ├── env.py              # Alembic config (supports SQLite & Turso)
│   └── versions/           # Database migrations
├── src/
│   ├── api/
│   │   └── routers/        # API endpoints (thin layer, auth checks)
│   │       ├── courses.py  # Course data operations
│   │       └── canvas.py   # Canvas integration
│   ├── services/           # Business logic (no HTTP, custom exceptions)
│   │   └── canvas_sync.py  # Canvas sync service
│   ├── models/             # Pydantic models
│   │   └── course.py       # Course, Term models
│   ├── security/           # Security utilities
│   │   └── encryption.py   # Token encryption
│   ├── utils/              # Helper functions
│   │   └── canvas.py       # Canvas API client
│   ├── auth.py             # Authentication (API key verification)
│   ├── database.py         # DB connection setup
│   └── main.py             # FastAPI app (includes auth middleware)
├── .env                    # Local environment variables (git-ignored)
├── .gitignore
├── pyproject.toml          # UV dependencies
├── uv.lock                 # UV lock file
└── vercel.json             # Vercel deployment config
```

---

## Vercel Deployment Guidelines

### vercel.json Configuration
```json
{
  "builds": [
    {
      "src": "src/main.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/main.py"
    }
  ]
}
```

### Environment Variables (Vercel Dashboard)
Set these in Vercel project settings:
```
DATABASE_URL=libsql://your-db.turso.io?authToken=xxx
ENCRYPTION_KEY=your-production-key
ALLOWED_API_KEYS=key1,key2
CANVAS_API_URL=https://canvas.instructure.com
```

### Pre-deployment Checklist
- [ ] All secrets in Vercel environment variables (not in code)
- [ ] Database URL points to Turso (not local SQLite)
- [ ] All endpoints have authentication
- [ ] Migrations tested locally
- [ ] `.env` is in `.gitignore`
- [ ] Logging configured (no print statements)
- [ ] Error messages don't expose internals

---

## Code Review Checklist

Before committing, ensure:

- [ ] All functions have type hints
- [ ] All public functions have docstrings
- [ ] Using `logging` instead of `print()`
- [ ] No sensitive data in logs (tokens masked)
- [ ] SQL queries are parameterized
- [ ] Error messages don't expose internals
- [ ] Empty results return `[]`, not 404
- [ ] Proper HTTP methods (GET for reads, POST for actions)
- [ ] No hardcoded secrets
- [ ] `.env` in `.gitignore`
- [ ] Import organization (stdlib, third-party, local)
- [ ] Single responsibility per function
- [ ] Custom exceptions for service layer
- [ ] **All endpoints have authentication** (public deployment!)
- [ ] HTTPException only in route layer
- [ ] Service layer uses custom exceptions

---

## Current Code Issues to Fix

Based on `canvas_sync.py`:

### 1. Remove HTTPException from Service Layer
```python
# ❌ Current (wrong)
def sync_user_courses(canvas_user_id):
    try:
        # ...
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")

# ✅ Fixed
class CanvasSyncError(Exception):
    """Custom exception for sync operations."""
    pass

def sync_user_courses(canvas_user_id: int, canvas_token: str) -> Dict[str, Any]:
    """Syncs user's Canvas courses using efficient bulk operations."""
    try:
        courses = get_courses(canvas_token)  # Pass token!
        # ...
        return {"synced": synced_count, "total": len(courses)}
    except Exception as e:
        logger.error(f"Sync failed for user {canvas_user_id}: {e}")
        raise CanvasSyncError("Canvas sync failed")
```

### 2. Replace print() with logging
```python
# ❌ Current
print("No courses found to sync")
print(f"Successfully synced {synced_count} courses")

# ✅ Fixed
logger.info("No courses found to sync")
logger.info(f"Successfully synced {synced_count} courses for user {canvas_user_id}")
```

### 3. Add Type Hints
```python
# ❌ Current
def sync_user_courses(canvas_user_id):

# ✅ Fixed
def sync_user_courses(canvas_user_id: int, canvas_token: str) -> Dict[str, Any]:
```

### 4. Fix get_courses() - Missing Token
```python
# ❌ Current
def get_courses() -> List[Course]:
    raw_courses, response_status = fetch_canvas_courses()  # Where's the token?

# ✅ Fixed
def get_courses(canvas_token: str) -> List[Course]:
    """
    Get user's Canvas courses using their API token.
    
    Args:
        canvas_token: User's Canvas API access token
        
    Returns:
        List of Course objects
        
    Raises:
        CanvasSyncError: If fetch fails
    """
    try:
        raw_courses, response_status = fetch_canvas_courses(canvas_token)
        return process_raw_courses(raw_courses)
    except requests.exceptions.RequestException as e:
        raise CanvasSyncError(f"Canvas API request failed: {str(e)}")
```

---

## Questions or Clarifications?

When suggesting code, GitHub Copilot should:
1. Follow these guidelines strictly
2. Ask clarifying questions if requirements are ambiguous
3. Suggest better alternatives when patterns don't match guidelines
4. Explain security implications for sensitive operations (especially for public deployment)
5. Provide examples following project conventions
6. **Always include authentication checks** for public endpoints
7. **Never suggest ORM usage** - this project uses raw SQL
8. **Prefer logging over printing** for all output
9. **Use custom exceptions in services**, HTTPException only in routes

---

## Version
Last updated: October 4, 2025  
Project: Canned v0.1.0  
Python: 3.11+ (managed by UV)  
FastAPI: Latest  
Database: SQLite (local), Turso (production)  
Deployment: Vercel (Serverless)