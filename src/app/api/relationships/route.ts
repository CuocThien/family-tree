/**
 * Relationships API Routes - Collection Endpoints
 *
 * POST /api/relationships - Create new relationship
 */

import { z } from 'zod';
import { withAuth, AuthenticatedRequest } from '@/lib/api/withAuth';
import { withValidation } from '@/lib/api/withValidation';
import { successResponse, errors } from '@/lib/api/response';
import { container } from '@/lib/di';
import { SERVICES } from '@/lib/di/types';

// Schema matching the DTO from the types folder
const createRelationshipSchema = z.object({
  treeId: z.string().min(1, 'Tree ID is required'),
  fromPersonId: z.string().min(1, 'From person ID is required'),
  toPersonId: z.string().min(1, 'To person ID is required'),
  type: z.enum(['parent', 'child', 'spouse', 'sibling'] as const, {
    errorMap: () => ({ message: 'Invalid relationship type' }),
  }),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
}).refine(
  (data) => !data.endDate || !data.startDate || data.endDate >= data.startDate,
  { message: 'End date must be after start date', path: ['endDate'] }
).refine(
  (data) => data.fromPersonId !== data.toPersonId,
  { message: 'Cannot create relationship with same person', path: ['toPersonId'] }
);

/**
 * POST /api/relationships
 * Creates a new relationship between two persons.
 */
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  const validation = await withValidation(createRelationshipSchema)(request);

  if (validation instanceof Response) {
    return validation;
  }

  try {
    const relationship = await container.relationshipService.createRelationship(
      validation.data.treeId,
      request.user.id,
      validation.data
    );
    return successResponse(relationship, undefined, 201);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Permission')) {
        return errors.forbidden();
      }
      if (error.message.includes('Validation')) {
        return errors.badRequest(error.message);
      }
      if (error.message.includes('not found')) {
        return errors.notFound('Person or Tree');
      }
      if (error.message.includes('cycle') || error.message.includes('circular')) {
        return errors.conflict('This relationship would create a circular reference');
      }
    }
    throw error;
  }
});
