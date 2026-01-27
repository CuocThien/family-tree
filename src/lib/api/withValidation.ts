/**
 * API Validation Middleware
 *
 * Provides request body validation using Zod schemas.
 * Returns validation errors in a consistent format.
 */

import type { NextRequest, NextResponse } from 'next/server';
import { z, ZodSchema, ZodError } from 'zod';
import { errors } from './response';

/**
 * Validation result that either contains validated data or an error response.
 */
export type ValidationResult<T> =
  | { data: T }
  | NextResponse;

/**
 * Creates a validation middleware function for a given Zod schema.
 *
 * @example
 * ```ts
 * const schema = z.object({
 *   name: z.string().min(1),
 *   age: z.number().min(0),
 * });
 *
 * export const POST = withAuth(async (request) => {
 *   const validation = await withValidation(schema)(request);
 *
 *   if (validation instanceof Response) {
 *     return validation; // Validation error response
 *   }
 *
 *   // validation.data is typed and validated
 *   return successResponse(validation.data);
 * });
 * ```
 */
export function withValidation<T>(
  schema: ZodSchema<T>
): (request: NextRequest) => Promise<ValidationResult<T>> {
  return async (request: NextRequest): Promise<ValidationResult<T>> => {
    try {
      const body = await request.json();
      const data = schema.parse(body);
      return { data };
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string[]> = {};

        for (const err of error.errors) {
          const path = err.path.join('.');
          if (!fieldErrors[path]) {
            fieldErrors[path] = [];
          }
          fieldErrors[path].push(err.message);
        }

        return errors.validationFailed(fieldErrors);
      }

      return errors.badRequest('Invalid JSON body');
    }
  };
}
