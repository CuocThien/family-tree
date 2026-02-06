/**
 * Tree Relationships API Route
 *
 * GET /api/trees/[id]/relationships - Get all relationships in a tree
 */

import { withAuth, AuthenticatedRequest } from '@/lib/api/withAuth';
import { successResponse, errors } from '@/lib/api/response';
import { container, getContainer, SERVICES } from '@/lib/di';
import type { IRelationshipRepository } from '@/repositories/interfaces/IRelationshipRepository';

/**
 * GET /api/trees/[id]/relationships
 * Retrieves all relationships belonging to a specific tree.
 *
 * Returns an array of IRelationship objects containing:
 * - _id: Relationship ID
 * - treeId: Tree ID
 * - fromPersonId: Source person ID (e.g., parent)
 * - toPersonId: Target person ID (e.g., child)
 * - type: Relationship type ('parent' | 'child' | 'spouse' | 'sibling')
 * - startDate: Optional start date
 * - endDate: Optional end date
 * - notes: Optional notes
 * - createdAt: Creation timestamp
 * - updatedAt: Last update timestamp
 */
export const GET = withAuth(async (request: AuthenticatedRequest, context) => {
  const params = await context.params;

  // Verify tree exists and user has access
  const tree = await container.treeService.getTreeById(params.id, request.user.id);

  if (!tree) {
    return errors.notFound('Tree');
  }

  // Get all relationships for the tree directly
  const relationshipRepository = getContainer().resolve<IRelationshipRepository>(SERVICES.RelationshipRepository);
  const relationships = await relationshipRepository.findByTreeId(params.id);

  return successResponse(relationships, {
    total: relationships.length,
  });
});
