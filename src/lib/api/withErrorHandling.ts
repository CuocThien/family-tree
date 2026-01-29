/**
 * Centralized error handling middleware for API routes.
 * Provides consistent error responses across all API endpoints.
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import {
  ValidationError,
  PermissionError,
  NotFoundError,
  ConflictError,
  BusinessRuleError,
} from '@/services/errors/ServiceErrors';
import type { AuthenticatedRequest } from './withAuth';

/**
 * Handles errors and returns appropriate HTTP responses.
 * Sanitizes error messages for production to prevent sensitive data leakage.
 */
export function handleApiError(error: unknown): NextResponse {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Log error for monitoring (sanitized in production)
  if (isDevelopment) {
    console.error('API Error:', error);
  } else {
    // In production, log only safe information
    console.error('API Error:', error instanceof Error ? error.name : 'Unknown error');
  }

  // Custom error types
  if (error instanceof ValidationError) {
    return NextResponse.json(
      { error: error.errors[0] || 'Validation failed' },
      { status: 400 }
    );
  }

  if (error instanceof PermissionError) {
    return NextResponse.json(
      { error: 'Permission denied' },
      { status: 403 }
    );
  }

  if (error instanceof NotFoundError) {
    return NextResponse.json(
      { error: error.message },
      { status: 404 }
    );
  }

  if (error instanceof ConflictError) {
    return NextResponse.json(
      { error: error.message },
      { status: 409 }
    );
  }

  if (error instanceof BusinessRuleError) {
    return NextResponse.json(
      { error: error.message },
      { status: 422 }
    );
  }

  // Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: error.errors[0]?.message || 'Validation failed' },
      { status: 400 }
    );
  }

  // Generic errors - sanitize in production
  if (error instanceof Error) {
    // In production, don't expose internal error messages
    const message = isDevelopment ? error.message : 'An internal error occurred';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }

  // Unknown error types
  return NextResponse.json(
    { error: isDevelopment ? String(error) : 'An internal error occurred' },
    { status: 500 }
  );
}

/**
 * Higher-order function that wraps API route handlers with error handling.
 * Usage:
 * ```
 * export const GET = withErrorHandling(async (request) => {
 *   // Your route logic here
 *   return successResponse(data);
 * });
 * ```
 */
export function withErrorHandling<T extends Request | AuthenticatedRequest>(
  handler: (request: T) => Promise<NextResponse>
): (request: T) => Promise<NextResponse> {
  return async (request: T): Promise<NextResponse> => {
    try {
      return await handler(request);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
