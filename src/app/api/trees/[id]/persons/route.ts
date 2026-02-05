/**
 * Tree Persons API Route
 *
 * GET /api/trees/[id]/persons - Get all persons in a tree
 */

import { withAuth, AuthenticatedRequest } from '@/lib/api/withAuth';
import { successResponse, errors } from '@/lib/api/response';
import { container } from '@/lib/di';

/**
 * GET /api/trees/[id]/persons
 * Retrieves all persons belonging to a specific tree.
 */
export const GET = withAuth(async (request: AuthenticatedRequest, context) => {
  const params = await context.params;

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  const search = url.searchParams.get('search') || undefined;

  try {
    const result = await container.personService.getPersonsByTreeId(params.id, request.user.id, {
      page,
      limit,
      query: search,
    });

    return successResponse(result.persons, {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return errors.notFound('Tree');
      }
      if (error.message.includes('Permission')) {
        return errors.forbidden();
      }
    }
    throw error;
  }
});
