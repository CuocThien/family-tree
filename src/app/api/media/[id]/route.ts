/**
 * Media API Routes - Single Resource Endpoints
 *
 * GET /api/media/[id] - Get media by ID
 * DELETE /api/media/[id] - Delete media
 */

import { z } from 'zod';
import { withAuth, AuthenticatedRequest } from '@/lib/api/withAuth';
import { withValidation } from '@/lib/api/withValidation';
import { successResponse, errors } from '@/lib/api/response';
import { container } from '@/lib/di';

const updateMediaSchema = z.object({
  personId: z.string().optional(),
  description: z.string().max(2000).optional(),
  dateTaken: z.coerce.date().optional(),
});

/**
 * GET /api/media/[id]
 * Retrieves a specific media item by ID.
 */
export const GET = withAuth(async (request: AuthenticatedRequest, context) => {
  const params = await context.params;
  const media = await container.mediaService.getMediaById(params.id, request.user.id);

  if (!media) {
    return errors.notFound('Media');
  }

  return successResponse(media);
});

/**
 * PUT /api/media/[id]
 * Updates media metadata.
 */
export const PUT = withAuth(async (request: AuthenticatedRequest, context) => {
  const params = await context.params;
  const validation = await withValidation(updateMediaSchema)(request);

  if (validation instanceof Response) {
    return validation;
  }

  try {
    const media = await container.mediaService.updateMedia(
      params.id,
      request.user.id,
      validation.data
    );
    return successResponse(media);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return errors.notFound('Media');
      }
      if (error.message.includes('Permission')) {
        return errors.forbidden();
      }
    }
    throw error;
  }
});

/**
 * DELETE /api/media/[id]
 * Deletes a media item.
 */
export const DELETE = withAuth(async (request: AuthenticatedRequest, context) => {
  const params = await context.params;

  try {
    await container.mediaService.deleteMedia(params.id, request.user.id);
    return successResponse({ deleted: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return errors.notFound('Media');
      }
      if (error.message.includes('Permission')) {
        return errors.forbidden();
      }
    }
    throw error;
  }
});
