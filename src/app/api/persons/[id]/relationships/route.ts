/**
 * Person Relationships API Route
 *
 * GET /api/persons/[id]/relationships - Get all relationships for a person
 */

import { withAuth, AuthenticatedRequest } from '@/lib/api/withAuth';
import { successResponse, errors } from '@/lib/api/response';
import { container } from '@/lib/di';

/**
 * GET /api/persons/[id]/relationships
 * Retrieves all relationships for a specific person.
 */
export const GET = withAuth(async (request: AuthenticatedRequest, context) => {
  const params = await context.params;
  const personId = params.id;

  try {
    const relationshipService = container.relationshipService;

    // Get all relationships for the person
    const familyMembers = await relationshipService.getFamilyMembers(personId, request.user.id);

    // Transform the data into the expected format
    const relationships = [
      ...familyMembers.parents.map((p) => ({
        _id: `rel-${personId}-${p._id}-parent`,
        relatedPersonId: p._id,
        relationshipType: 'parent' as const,
        relatedPersonName: `${p.firstName} ${p.lastName}`,
      })),
      ...familyMembers.children.map((p) => ({
        _id: `rel-${personId}-${p._id}-child`,
        relatedPersonId: p._id,
        relationshipType: 'child' as const,
        relatedPersonName: `${p.firstName} ${p.lastName}`,
      })),
      ...familyMembers.spouses.map((p) => ({
        _id: `rel-${personId}-${p._id}-spouse`,
        relatedPersonId: p._id,
        relationshipType: 'spouse' as const,
        relatedPersonName: `${p.firstName} ${p.lastName}`,
      })),
      ...familyMembers.siblings.map((p) => ({
        _id: `rel-${personId}-${p._id}-sibling`,
        relatedPersonId: p._id,
        relationshipType: 'sibling' as const,
        relatedPersonName: `${p.firstName} ${p.lastName}`,
      })),
    ];

    return successResponse(relationships);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return errors.notFound('Person');
      }
      if (error.message.includes('Permission')) {
        return errors.forbidden();
      }
    }
    throw error;
  }
});
