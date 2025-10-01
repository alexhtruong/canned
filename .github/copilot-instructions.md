# GitHub Copilot PR Review Instructions

## Project Overview

Canned is a Canvas notification management application with a FastAPI backend and Next.js frontend.

## Project Structure

- **Backend** (`/backend`): Python FastAPI application with SQLAlchemy ORM and PostgreSQL
- **Frontend** (`/frontend`): Next.js 15 application with TypeScript, React 19, and Tailwind CSS

## Code Review Guidelines

### General

- Ensure code changes are minimal and focused on the specific issue
- Check for proper error handling and edge cases
- Verify that changes don't introduce security vulnerabilities
- Ensure backward compatibility with existing features
- Check for potential performance issues

### Backend (Python/FastAPI)

- **Code Style**: Follow PEP 8 guidelines
- **Type Hints**: Ensure all functions have proper type annotations
- **Database**: 
  - Check for proper SQLAlchemy query patterns
  - Verify migrations are correctly defined in Alembic
  - Ensure database connections are properly managed with sessions
- **API Design**:
  - Validate Pydantic models for request/response validation
  - Check CORS configuration for security
  - Ensure proper HTTP status codes are returned
  - Verify error responses are informative
- **Dependencies**: Review any new dependencies added to `pyproject.toml`
- **Security**:
  - Check for SQL injection vulnerabilities
  - Ensure sensitive data is not logged
  - Verify proper authentication/authorization if applicable

### Frontend (Next.js/TypeScript)

- **Code Style**: Follow TypeScript and React best practices
- **Type Safety**: Ensure proper TypeScript types are used, avoid `any` types
- **Components**:
  - Verify components follow the existing structure (client/server components)
  - Check for proper use of React hooks
  - Ensure accessibility (ARIA labels, keyboard navigation)
- **State Management**: Review state management patterns for consistency
- **Styling**: 
  - Ensure Tailwind CSS classes are used consistently
  - Check for responsive design considerations
  - Verify dark mode support if applicable
- **Performance**:
  - Check for unnecessary re-renders
  - Verify proper use of Next.js features (Image, Link components)
  - Review bundle size impact of new dependencies
- **Dependencies**: Review any new dependencies added to `package.json`
- **UI/UX**:
  - Ensure consistent design with existing components
  - Check for loading states and error handling in UI
  - Verify proper toast notifications using Sonner library

### Testing

- Verify that existing tests still pass
- Encourage addition of tests for new features
- Check for edge case coverage
- Ensure test files follow existing patterns

### Documentation

- Verify README updates if project setup changes
- Check for inline comments where complex logic is added
- Ensure API endpoints are properly documented
- Review commit messages for clarity

### Common Issues to Watch For

1. **API Integration**: Ensure frontend API calls match backend endpoints
2. **Environment Variables**: Check for proper handling of configuration
3. **Error Boundaries**: Verify error handling in both frontend and backend
4. **Data Validation**: Ensure data is validated on both client and server
5. **Canvas API**: Check for proper handling of Canvas API interactions
6. **User Subscriptions**: Verify proper handling of course subscriptions

## Specific Patterns to Follow

### Backend Request Handlers

```python
@app.get("/endpoint", response_model=ResponseModel)
async def handler() -> ResponseModel:
    """
    Clear description of endpoint purpose
    """
    try:
        # Implementation
        pass
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### Frontend Components

```typescript
"use client"  // Only if needed

import { Component } from "@/components/..."

export function ComponentName() {
  // Implementation
  return (
    <div className="...">
      {/* Content */}
    </div>
  )
}
```

## Review Focus Areas

1. **Code Quality**: Is the code clean, maintainable, and following project conventions?
2. **Functionality**: Does the code accomplish the stated goal?
3. **Security**: Are there any security concerns?
4. **Performance**: Could this impact application performance negatively?
5. **Testing**: Is the code testable and are appropriate tests included?
6. **Documentation**: Is the code sufficiently documented for maintainability?

## Additional Notes

- The project uses `uv` for Python dependency management
- Frontend uses `bun` for package management (based on bun.lock)
- Database migrations are managed through Alembic
- The project uses shadcn/ui components for the frontend
