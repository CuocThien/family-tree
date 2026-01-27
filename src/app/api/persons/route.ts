/**
 * Persons API Routes - Collection Endpoints
 *
 * POST /api/persons - Create new person
 */

import { z } from 'zod';
import { withAuth, AuthenticatedRequest } from '@/lib/api/withAuth';
import { withValidation } from '@/lib/api/withValidation';
import { successResponse, errors } from '@/lib/api/response';
import { container } from '@/lib/di';

// Schema matching the DTO from the types folder
const createPersonSchema = z.object({
  treeId: z.string().min(1, 'Tree ID is required'),
  firstName: z.string().min(1, 'First name is required').max(100, 'First name too long').trim(),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name too long').trim(),
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
 * POST /api/persons
 * Creates a new person in a tree.
 */
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  const validation = await withValidation(createPersonSchema)(request);

  if (validation instanceof Response) {
    return validation;
  }

  try {
    const person = await container.personService.createPerson(
      validation.data.treeId,
      request.user.id,
      validation.data
    );
    return successResponse(person, undefined, 201);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Permission')) {
        return errors.forbidden();
      }
      if (error.message.includes('Validation')) {
        return errors.badRequest(error.message);
      }
      if (error.message.includes('not found')) {
        return errors.notFound('Tree');
      }
    }
    throw error;
  }
});
