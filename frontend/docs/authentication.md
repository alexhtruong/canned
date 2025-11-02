# Frontend Authentication Setup

This document explains how to configure and use API authentication in the Canned frontend application.

## Overview

The frontend uses API key authentication to communicate with the backend. Each user has their own API key that must be included in all API requests.

## Configuration

### Environment Variables

1. Copy the example environment file:
   ```bash
   cd frontend
   cp .env.example .env.local
   ```

2. Update `.env.local` with your configuration:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_API_KEY=your_api_key_here
   ```

### Production Deployment

For production deployment on Vercel:

1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Add the following variables:
   - `NEXT_PUBLIC_API_URL`: Your backend API URL
   - `NEXT_PUBLIC_API_KEY`: Your user's API key

## Usage

### Using the API Helper

Import and use the `apiRequest` helper function from `lib/api/config`:

```typescript
import { apiRequest } from '@/lib/api/config';

// GET request
const courses = await apiRequest<Course[]>('/courses');

// POST request
const result = await apiRequest('/subscriptions/courses/123', {
  method: 'POST',
  body: JSON.stringify({ is_active: true })
});

// With query parameters
const assignments = await apiRequest('/assignments', {
  params: { status: 'pending' }
});
```

### Direct (Fetch) Usage

If you need to use fetch directly:

```typescript
const response = await fetch(`${API_BASE_URL}/courses`, {
  headers: {
    'X-API-Key': process.env.NEXT_PUBLIC_API_KEY,
    'Content-Type': 'application/json'
  }
});
```

## Security Considerations

1. **API Key Exposure**: The API key is exposed in the browser. This is acceptable for this use case since:
   - The app is limited to 2 authorized users
   - The API key only grants access to that user's data
   - No sensitive operations are performed

2. **HTTPS Only**: Always use HTTPS in production to encrypt API keys in transit

3. **Environment Variables**: Never commit `.env.local` to version control

## Error Handling

The API helper includes built-in error handling:

```typescript
try {
  const data = await apiRequest('/courses');
  // Handle success
} catch (error) {
  if (error.message.includes('401')) {
    // Invalid or missing API key
  } else {
    // Other error
  }
}
```

## Troubleshooting

### 401 Unauthorized Errors

1. Check that `NEXT_PUBLIC_API_KEY` is set in `.env.local`
2. Verify the API key matches one configured in the backend
3. Ensure the API key doesn't have extra spaces or quotes

### CORS Errors

1. Verify the backend CORS configuration includes your frontend URL
2. Check that the API URL in `.env.local` is correct
3. Make sure you're using the correct protocol (http/https)

### Environment Variables Not Loading

1. Restart the Next.js development server after changing `.env.local`
2. Ensure variable names start with `NEXT_PUBLIC_`
3. Check that `.env.local` is in the frontend root directory

## Development Workflow

1. Generate API keys using the backend script
2. Configure one key for development in `.env.local`
3. Use a different key for production
4. Test authentication using the backend test script

## Multiple Users

If you need to support switching between users in development:

1. Create multiple `.env` files:
   - `.env.user1`
   - `.env.user2`

2. Switch between them:
   ```bash
   cp .env.user1 .env.local
   npm run dev
   ```

Or implement user switching in the UI by storing the API key in localStorage (development only).