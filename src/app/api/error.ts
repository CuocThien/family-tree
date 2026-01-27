/**
 * API Error Handler
 *
 * Central error handling utility for API routes.
 * Catches and formats errors into consistent API responses.
 */

import { NextResponse } from 'next/server';
import { errors } from '@/lib/api/response';

/**
 * Handle API errors and return appropriate error responses.
 * Logs errors for debugging while returning user-friendly messages.
 *
 * @param error - The error to handle
 * @returns NextResponse with appropriate error status and message
 */
export function handleApiError(error: unknown): NextResponse {
  // Log the full error for debugging
  console.error('API Error:', error);

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Check for common error patterns
    if (message.includes('not found')) {
      return errors.notFound('Resource');
    }

    if (message.includes('permission') || message.includes('denied') || message.includes('unauthorized')) {
      return errors.forbidden();
    }

    if (message.includes('validation')) {
      return errors.badRequest(error.message);
    }

    if (message.includes('duplicate') || message.includes('exists')) {
      return errors.conflict(error.message);
    }
  }

  // Unknown error - return generic internal server error
  return errors.internal();
}
