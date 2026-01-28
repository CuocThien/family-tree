/**
 * Tree Relationships API Route
 *
 * GET /api/trees/[id]/relationships - Get all relationships in a tree
 */

import { withAuth, AuthenticatedRequest } from '@/lib/api/withAuth';
import { successResponse, errors } from '@/lib/api/response';
import { container } from '@/lib/di';

/**
 * GET /api/trees/[id]/relationships
 * Retrieves all relationships belonging to a specific tree.
 */
export const GET = withAuth(async (request: AuthenticatedRequest, context) => {
  const params = await context.params;

  const tree = await container.treeService.getTreeById(params.id, request.user.id);

  if (!tree) {
    return errors.notFound('Tree');
  }

  // Get relationships by querying through persons in the tree
  const personsResult = await container.personService.getPersonsByTreeId(params.id, request.user.id);

  // Collect relationships for all persons
  const relationships: unknown[] = [];
  for (const person of personsResult.persons) {
    const family = await container.relationshipService.getFamilyMembers(person._id.toString(), request.user.id);
    // Add relationships to the result
    relationships.push(family);
  }

  return successResponse(relationships, {
    total: relationships.length,
  });
});
