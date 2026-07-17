// Error formatting utility — converts ApiError into user-friendly messages

import type { ApiError } from '../types';

export function getErrorMessage(error: ApiError | null): string {
  if (!error) return '';
  if (error.statusCode === 0) return 'Unable to reach the server. Check your connection.';
  if (error.statusCode === 401) return 'Your session has expired. Please sign in again.';
  if (error.statusCode === 403) return 'You do not have permission to perform this action.';
  if (error.statusCode === 404) return 'The requested resource was not found.';
  if (error.statusCode === 429) return 'Too many requests. Please slow down.';
  if (error.statusCode >= 500) return 'A server error occurred. Please try again later.';
  return error.message || 'An unexpected error occurred.';
}
