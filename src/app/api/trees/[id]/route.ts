/**
 * Trees API Routes - Single Resource Endpoints
 *
 * GET /api/trees/[id] - Get tree by ID
 * PUT /api/trees/[id] - Update tree
 * DELETE /api/trees/[id] - Delete tree
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth, AuthenticatedRequest } from '@/lib/api/withAuth';
import { withValidation } from '@/lib/api/withValidation';
import { successResponse, errors } from '@/lib/api/response';
import { container } from '@/lib/di';
import { SERVICES } from '@/lib/di/types';

/**
 * Schema for validating tree update requests.
 */
const updateTreeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  privacy: z.enum(['private', 'family', 'public']).optional(),
  coverImage: z.string().url().optional(),
});

/**
 * GET /api/trees/[id]
 * Retrieves a specific tree by ID.
 * User must have access to the tree (owner or collaborator).
 */
export const GET = withAuth(async (request: AuthenticatedRequest, context) => {
  const params = await context.params;
  const tree = await container.treeService.getTreeById(params.id, request.user.id);

  if (!tree) {
    return errors.notFound('Tree');
  }

  return successResponse(tree);
});

/**
 * PUT /api/trees/[id]
 * Updates a tree. Only the owner can update the tree.
 */
export const PUT = withAuth(async (request: AuthenticatedRequest, context) => {
  const params = await context.params;
  const validation = await withValidation(updateTreeSchema)(request);

  if (validation instanceof Response) {
    return validation;
  }

  try {
    const tree = await container.treeService.updateTree(
      params.id,
      request.user.id,
      validation.data
    );
    return successResponse(tree);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return errors.notFound('Tree');
      }
      if (error.message.includes('Permission') || error.message.includes('owner')) {
        return errors.forbidden();
      }
      if (error.message.includes('Validation')) {
        return errors.badRequest(error.message);
      }
    }
    throw error;
  }
});

/**
 * DELETE /api/trees/[id]
 * Deletes a tree. Only the owner can delete the tree.
 */
export const DELETE = withAuth(async (request: AuthenticatedRequest, context) => {
  const params = await context.params;

  try {
    await container.treeService.deleteTree(params.id, request.user.id);
    return successResponse({ deleted: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return errors.notFound('Tree');
      }
      if (error.message.includes('owner') || error.message.includes('Permission')) {
        return errors.forbidden();
      }
    }
    throw error;
  }
});
