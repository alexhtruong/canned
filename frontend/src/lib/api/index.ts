import { apiRequest } from './config';

// Types
export interface Course {
  id: number;
  name: string;
  course_code: string;
  term?: {
    id: number;
    name: string;
    start_at: string;
  };
}

export interface Assignment {
  id: string;
  name: string;
  courseCode: string;
  courseName: string;
  dueDate: string;
  graded: boolean;
  submitted: boolean;
  isLocallyComplete: boolean;
  points: number;
  canvasUrl: string;
  description: string;
}

export interface Subscription {
  canvas_course_id: number;
  course_name: string;
  course_code: string;
}

export interface SyncResult {
  status: string;
  courses: {
    synced: number;
    total: number;
  };
  assignments: {
    synced: number;
    total: number;
  };
  message: string;
}

// Course endpoints
export const coursesApi = {
  getAll: () => apiRequest<Course[]>('/courses'),
};

// Assignment endpoints
export const assignmentsApi = {
  getAll: () => apiRequest<Assignment[]>('/assignments'),

  updateSubmission: (assignmentId: number, isLocallyComplete: boolean) =>
    apiRequest(`/assignments/${assignmentId}/submission`, {
      method: 'PATCH',
      body: JSON.stringify({ is_locally_complete: isLocallyComplete }),
    }),
};

// Subscription endpoints
export const subscriptionsApi = {
  getAll: () => apiRequest<Subscription[]>('/subscriptions'),

  subscribe: (courseId: number) =>
    apiRequest(`/subscriptions/courses/${courseId}`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),

  unsubscribe: (courseId: number) =>
    apiRequest(`/subscriptions/courses/${courseId}`, {
      method: 'DELETE',
    }),

  toggle: (courseId: number, is_subscribed: boolean) =>
    apiRequest(`/subscriptions/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify({ is_subscribed: is_subscribed }),
    }),
};

// Canvas sync endpoint
export const canvasApi = {
  sync: () => apiRequest<SyncResult>('/canvas/sync', { method: 'POST' }),
};

// Re-export existing functions
export { fetchAssignments, transformAssignments } from './assignments';
