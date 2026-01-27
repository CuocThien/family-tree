/**
 * Trees API Routes - Collection Endpoints
 *
 * GET /api/trees - List user's trees
 * POST /api/trees - Create new tree
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth, AuthenticatedRequest } from '@/lib/api/withAuth';
import { withValidation } from '@/lib/api/withValidation';
import { successResponse, errors } from '@/lib/api/response';
import { container } from '@/lib/di';

/**
 * Schema for validating tree creation requests.
 */
const createTreeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  privacy: z.enum(['private', 'family', 'public']).default('private'),
});

/**
 * GET /api/trees
 * Lists all trees accessible to the authenticated user.
 */
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  const trees = await container.treeService.getTreesByUserId(request.user.id);

  return successResponse(trees, {
    total: trees.length,
  });
});

/**
 * POST /api/trees
 * Creates a new tree owned by the authenticated user.
 */
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  const validation = await withValidation(createTreeSchema)(request);

  if (validation instanceof Response) {
    return validation;
  }

  try {
    const tree = await container.treeService.createTree(request.user.id, validation.data);
    return successResponse(tree, undefined, 201);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Validation')) {
        return errors.badRequest(error.message);
      }
    }
    throw error;
  }
});
