/**
 * API Authentication Middleware
 *
 * Wraps route handlers with authentication checks using NextAuth.js.
 * Extends NextRequest with user information for authenticated requests.
 */

import { auth } from '@/lib/auth';
import type { NextRequest, NextResponse } from 'next/server';
import { errors } from './response';

/**
 * Extended request type that includes authenticated user information.
 */
export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  };
}

/**
 * Route handler type that works with authenticated requests.
 */
type AuthenticatedRouteHandler = (
  request: AuthenticatedRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

/**
 * Higher-order function that wraps a route handler with authentication.
 * Returns 401 if the user is not authenticated.
 *
 * @example
 * ```ts
 * export const GET = withAuth(async (request, context) => {
 *   // request.user is available here
 *   return successResponse({ data: 'protected' });
 * });
 * ```
 */
export function withAuth(handler: AuthenticatedRouteHandler) {
  return async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    const session = await auth();

    if (!session?.user) {
      return errors.unauthorized();
    }

    // Type assertion to add user to request
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = {
      id: session.user.id as string,
      email: session.user.email as string,
      name: session.user.name,
      image: session.user.image,
    };

    return handler(authenticatedRequest, context);
  };
}
