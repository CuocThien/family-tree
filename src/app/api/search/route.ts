/**
 * Search API Route
 *
 * GET /api/search - Search for persons and trees
 */

import { z } from 'zod';
import { withAuth, AuthenticatedRequest } from '@/lib/api/withAuth';
import { successResponse, errors } from '@/lib/api/response';
import { container } from '@/lib/di';
import { IPerson } from '@/types/person';
import { ITree } from '@/types/tree';

/**
 * Schema for validating search query parameters.
 */
const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100),
  type: z.enum(['all', 'persons', 'trees']).default('all'),
  treeId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

/**
 * GET /api/search
 * Searches for persons and/or trees based on the query.
 */
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  const { searchParams } = new URL(request.url);

  const validation = searchQuerySchema.safeParse({
    q: searchParams.get('q'),
    type: searchParams.get('type'),
    treeId: searchParams.get('treeId'),
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
  });

  if (!validation.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const error of validation.error.errors) {
      const path = error.path.join('.');
      if (!fieldErrors[path]) {
        fieldErrors[path] = [];
      }
      fieldErrors[path].push(error.message);
    }
    return errors.validationFailed(fieldErrors);
  }

  const { q, type, treeId, page, limit } = validation.data;

  const results: { persons?: IPerson[]; trees?: ITree[]; meta?: Record<string, unknown> } = {};

  // Search persons if type is 'all' or 'persons'
  if (type === 'all' || type === 'persons') {
    try {
      const personResults = await container.personService.getPersonsByTreeId(
        treeId || '',
        request.user.id,
        {
          query: q,
          page,
          limit,
        }
      );

      // Filter results by query if no treeId specified
      let persons = personResults.persons;
      if (!treeId) {
        const queryLower = q.toLowerCase();
        persons = persons.filter(
          (p) =>
            p.firstName?.toLowerCase().includes(queryLower) ||
            p.lastName?.toLowerCase().includes(queryLower) ||
            p.middleName?.toLowerCase().includes(queryLower)
        );
      }

      results.persons = persons;
      results.meta = {
        ...results.meta,
        persons: {
          total: persons.length,
          page,
          limit,
        },
      };
    } catch {
      // If search fails, continue with empty results
      results.persons = [];
    }
  }

  // Search trees if type is 'all' or 'trees'
  if (type === 'all' || type === 'trees') {
    try {
      const allTrees = await container.treeService.getTreesByUserId(request.user.id);

      // Filter trees by query
      const queryLower = q.toLowerCase();
      const filteredTrees = allTrees.filter(
        (tree: ITree) =>
          tree.name?.toLowerCase().includes(queryLower)
      );

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedTrees = filteredTrees.slice(startIndex, endIndex);

      results.trees = paginatedTrees;
      results.meta = {
        ...results.meta,
        trees: {
          total: filteredTrees.length,
          page,
          limit,
        },
      };
    } catch {
      // If search fails, continue with empty results
      results.trees = [];
    }
  }

  return successResponse(results, {
    page,
    limit,
  });
});
