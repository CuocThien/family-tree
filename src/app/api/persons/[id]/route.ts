/**
 * Persons API Routes - Single Resource Endpoints
 *
 * GET /api/persons/[id] - Get person by ID
 * PUT /api/persons/[id] - Update person
 * DELETE /api/persons/[id] - Delete person
 */

import { z } from 'zod';
import { withAuth, AuthenticatedRequest } from '@/lib/api/withAuth';
import { withValidation } from '@/lib/api/withValidation';
import { successResponse, errors } from '@/lib/api/response';
import { container } from '@/lib/di';

const updatePersonSchema = z.object({
  firstName: z.string().min(1).max(100).trim().optional(),
  lastName: z.string().min(1).max(100).trim().optional(),
  middleName: z.string().max(100).trim().optional(),
  dateOfBirth: z.coerce.date().optional(),
  dateOfDeath: z.coerce.date().optional(),
  gender: z.enum(['male', 'female', 'other', 'unknown'] as const).optional(),
  biography: z.string().max(5000).optional(),
  photos: z.array(z.string()).optional(),
  documents: z.array(z.string()).optional(),
  customAttributes: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
}).refine(
  (data) => !data.dateOfDeath || !data.dateOfBirth || data.dateOfDeath >= data.dateOfBirth,
  { message: 'Death date must be after birth date', path: ['dateOfDeath'] }
);

/**
 * GET /api/persons/[id]
 * Retrieves a specific person by ID.
 */
export const GET = withAuth(async (request: AuthenticatedRequest, context) => {
  const params = await context.params;
  const person = await container.personService.getPersonById(params.id, request.user.id);

  if (!person) {
    return errors.notFound('Person');
  }

  return successResponse(person);
});

/**
 * PUT /api/persons/[id]
 * Updates a person.
 */
export const PUT = withAuth(async (request: AuthenticatedRequest, context) => {
  const params = await context.params;
  const validation = await withValidation(updatePersonSchema)(request);

  if (validation instanceof Response) {
    return validation;
  }

  try {
    const person = await container.personService.updatePerson(
      params.id,
      request.user.id,
      validation.data
    );
    return successResponse(person);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return errors.notFound('Person');
      }
      if (error.message.includes('Permission')) {
        return errors.forbidden();
      }
      if (error.message.includes('Validation')) {
        return errors.badRequest(error.message);
      }
    }
    throw error;
  }
});

/**
 * DELETE /api/persons/[id]
 * Deletes a person.
 */
export const DELETE = withAuth(async (request: AuthenticatedRequest, context) => {
  const params = await context.params;

  try {
    await container.personService.deletePerson(params.id, request.user.id);
    return successResponse({ deleted: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return errors.notFound('Person');
      }
      if (error.message.includes('Permission')) {
        return errors.forbidden();
      }
      if (error.message.includes('relationships')) {
        return errors.conflict('Cannot delete person with existing relationships');
      }
    }
    throw error;
  }
});
