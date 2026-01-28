/**
 * Person Media API Route
 *
 * GET /api/persons/[id]/media - Get all media for a person
 */

import { withAuth, AuthenticatedRequest } from '@/lib/api/withAuth';
import { successResponse, errors } from '@/lib/api/response';
import { container } from '@/lib/di';

/**
 * GET /api/persons/[id]/media
 * Retrieves all media files associated with a specific person.
 */
export const GET = withAuth(async (request: AuthenticatedRequest, context) => {
  const params = await context.params;

  // First verify the person exists and user has access
  const person = await container.personService.getPersonById(params.id, request.user.id);

  if (!person) {
    return errors.notFound('Person');
  }

  // Get media for the person
  const media = await container.mediaService.getMediaByPersonId(params.id, request.user.id);

  return successResponse(media, {
    total: media.length,
  });
});
