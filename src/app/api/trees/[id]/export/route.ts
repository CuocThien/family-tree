/**
 * Tree Export API Route
 *
 * GET /api/trees/[id]/export - Export tree data
 */

import { withAuth, AuthenticatedRequest } from '@/lib/api/withAuth';
import { successResponse, errors } from '@/lib/api/response';
import { container } from '@/lib/di';

/**
 * GET /api/trees/[id]/export
 * Exports tree data including persons and relationships.
 */
export const GET = withAuth(async (request: AuthenticatedRequest, context) => {
  const params = await context.params;

  const url = new URL(request.url);
  const format = (url.searchParams.get('format') || 'json') as 'json' | 'gedcom';

  try {
    const exportData = await container.treeService.exportTree(params.id, request.user.id, format);

    return successResponse(exportData);
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
