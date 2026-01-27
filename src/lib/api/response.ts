/**
 * API Response Helpers
 *
 * Provides consistent response format for all API routes.
 * Includes success response, error response, and common error helpers.
 */

import { NextResponse } from 'next/server';

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: ApiError;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Create a successful API response with data and optional metadata.
 */
export function successResponse<T>(
  data: T,
  meta?: ApiResponse['meta'],
  status = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data, meta }, { status });
}

/**
 * Create an error response with code, message, and optional details.
 */
export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: Record<string, unknown>
): NextResponse<ApiResponse> {
  return NextResponse.json(
    { error: { code, message, details } },
    { status }
  );
}

/**
 * Common error response generators for typical HTTP error scenarios.
 */
export const errors = {
  unauthorized: () =>
    errorResponse('UNAUTHORIZED', 'Authentication required', 401),

  forbidden: () =>
    errorResponse('FORBIDDEN', 'Permission denied', 403),

  notFound: (resource: string) =>
    errorResponse('NOT_FOUND', `${resource} not found`, 404),

  badRequest: (message: string, details?: Record<string, unknown>) =>
    errorResponse('BAD_REQUEST', message, 400, details),

  conflict: (message: string) =>
    errorResponse('CONFLICT', message, 409),

  internal: () =>
    errorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500),

  validationFailed: (fieldErrors: Record<string, string[]>) =>
    errorResponse('VALIDATION_FAILED', 'Validation failed', 400, {
      errors: fieldErrors,
    }),

  rateLimited: () =>
    errorResponse('RATE_LIMITED', 'Too many requests', 429),
};
