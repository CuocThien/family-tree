/**
 * Media API Routes - Collection Endpoints
 *
 * POST /api/media - Upload media file
 */

import { withAuth, AuthenticatedRequest } from '@/lib/api/withAuth';
import { successResponse, errors } from '@/lib/api/response';
import { container } from '@/lib/di';

// File size limit: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'application/pdf',
];

/**
 * POST /api/media
 * Uploads a media file to a tree.
 */
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  const formData = await request.formData();

  const file = formData.get('file') as File | null;
  const treeId = formData.get('treeId') as string | null;
  const personId = formData.get('personId') as string | null;
  const title = formData.get('title') as string | null;
  const description = formData.get('description') as string | null;
  const dateTaken = formData.get('dateTaken') as string | null;

  if (!file) {
    return errors.badRequest('No file provided');
  }

  if (!treeId) {
    return errors.badRequest('Tree ID is required');
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return errors.badRequest(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return errors.badRequest(
      `File type not allowed. Allowed: ${ALLOWED_TYPES.join(', ')}`
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await container.mediaService.uploadMedia(request.user.id, {
      treeId,
      personId: personId || undefined,
      file: buffer,
      filename: file.name,
      mimeType: file.type,
      title: title || undefined,
      description: description || undefined,
      dateTaken: dateTaken ? new Date(dateTaken) : undefined,
    });

    return successResponse(result, undefined, 201);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Permission')) {
        return errors.forbidden();
      }
      if (error.message.includes('not found')) {
        return errors.notFound('Tree');
      }
      if (error.message.includes('Validation')) {
        return errors.badRequest(error.message);
      }
    }
    throw error;
  }
});
