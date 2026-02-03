/**
 * Relationships API Routes - Single Resource Endpoints
 *
 * GET /api/relationships/[id] - Get relationship by ID
 * PUT /api/relationships/[id] - Update relationship
 * DELETE /api/relationships/[id] - Delete relationship
 */

import { z } from 'zod';
import { withAuth, AuthenticatedRequest } from '@/lib/api/withAuth';
import { withValidation } from '@/lib/api/withValidation';
import { successResponse, errors } from '@/lib/api/response';
import { container } from '@/lib/di';

const updateRelationshipSchema = z.object({
  type: z.enum(['parent', 'child', 'spouse', 'sibling'] as const).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
}).refine(
  (data) => !data.endDate || !data.startDate || data.endDate >= data.startDate,
  { message: 'End date must be after start date', path: ['endDate'] }
);

/**
 * GET /api/relationships/[id]
 * Retrieves a specific relationship by ID.
 */
export const GET = withAuth(async (request: AuthenticatedRequest, context) => {
  // Note: RelationshipService doesn't have getRelationshipById method
  // We'll need to get it through the repository
  // TODO: Implement using relationship repository

  try {
    // This is a placeholder - the actual implementation would use the relationship repository
    return errors.notFound('Relationship');
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return errors.notFound('Relationship');
      }
      if (error.message.includes('Permission')) {
        return errors.forbidden();
      }
    }
    throw error;
  }
});

/**
 * PUT /api/relationships/[id]
 * Updates a relationship.
 */
export const PUT = withAuth(async (request: AuthenticatedRequest, context) => {
  const params = await context.params;
  const validation = await withValidation(updateRelationshipSchema)(request);

  if (validation instanceof Response) {
    return validation;
  }

  try {
    const relationship = await container.relationshipService.updateRelationship(
      params.id,
      request.user.id,
      validation.data
    );
    return successResponse(relationship);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return errors.notFound('Relationship');
      }
      if (error.message.includes('Permission')) {
        return errors.forbidden();
      }
      if (error.message.includes('Validation')) {
        return errors.badRequest(error.message);
      }
      if (error.message.includes('cycle') || error.message.includes('circular')) {
        return errors.conflict('This relationship would create a circular reference');
      }
    }
    throw error;
  }
});

/**
 * DELETE /api/relationships/[id]
 * Deletes a relationship.
 */
export const DELETE = withAuth(async (request: AuthenticatedRequest, context) => {
  const params = await context.params;

  try {
    await container.relationshipService.deleteRelationship(params.id, request.user.id);
    return successResponse({ deleted: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return errors.notFound('Relationship');
      }
      if (error.message.includes('Permission')) {
        return errors.forbidden();
      }
    }
    throw error;
  }
});
