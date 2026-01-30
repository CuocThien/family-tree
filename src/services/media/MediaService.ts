import { IMediaService, MediaUploadResult } from './IMediaService';
import { IMediaRepository } from '@/repositories/interfaces/IMediaRepository';
import { IStorageStrategy } from '@/strategies/storage/IStorageStrategy';
import { IPermissionService, Permission } from '@/services/permission/IPermissionService';
import { IAuditRepository } from '@/repositories/interfaces/IAuditRepository';
import { UploadMediaDto, UpdateMediaDto } from '@/types/dtos/media';
import { IMedia, MediaType } from '@/types/media';
import { ValidationError, PermissionError, NotFoundError } from '@/services/errors/ServiceErrors';
// Sharp is lazy-loaded to prevent bundling in client code
// It will only be loaded on the server when thumbnail generation is needed

export class MediaService implements IMediaService {
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
  ];
  private readonly THUMBNAIL_WIDTH = 300;
  private readonly THUMBNAIL_HEIGHT = 300;

  constructor(
    private readonly mediaRepository: IMediaRepository,
    private readonly storageStrategy: IStorageStrategy,
    private readonly permissionService: IPermissionService,
    private readonly auditLogRepository: IAuditRepository
  ) {}

  async uploadMedia(userId: string, data: UploadMediaDto & { file: Buffer }): Promise<MediaUploadResult> {
    // 1. Validate file
    const validationErrors = await this.validateFile(data.file, data.mimeType);
    if (validationErrors.length > 0) {
      throw new ValidationError(validationErrors);
    }

    // 2. Check permission
    const canUpload = await this.permissionService.canAccess(userId, data.treeId, Permission.EDIT_TREE);
    if (!canUpload) {
      throw new PermissionError('Permission denied');
    }

    // 3. Validate personId if provided
    if (data.personId) {
      // Would need to inject PersonRepository to validate person exists
      // For now, assume it's validated at a higher level
    }

    // 4. Upload to storage
    const uploadResult = await this.storageStrategy.upload(data.file, {
      filename: data.filename,
      mimeType: data.mimeType,
      folder: `trees/${data.treeId}/media`,
    });

    // 5. Generate thumbnail for images
    let thumbnailUrl: string | undefined;
    if (data.mimeType.startsWith('image/')) {
      try {
        thumbnailUrl = await this.generateThumbnailFromBuffer(data.file);
      } catch (error) {
        // Log error but don't fail the upload
        console.error('Failed to generate thumbnail:', error);
      }
    }

    // 6. Determine media type
    const mediaType = this.getMediaType(data.mimeType);

    // 7. Create media record
    const media = await this.mediaRepository.create({
      treeId: data.treeId,
      personId: data.personId,
      type: mediaType,
      filename: data.filename,
      mimeType: data.mimeType,
      size: data.file.length,
      url: uploadResult.url,
      metadata: {
        dateTaken: data.dateTaken,
        description: data.description?.trim(),
      },
    });

    // 8. Audit log
    await this.auditLogRepository.create({
      treeId: data.treeId,
      userId,
      action: 'create',
      entityType: 'Media',
      entityId: media._id,
      changes: [],
    });

    return {
      media,
      url: uploadResult.url,
      thumbnailUrl,
    };
  }

  async generateThumbnail(mediaId: string): Promise<string> {
    const media = await this.mediaRepository.findById(mediaId);
    if (!media) {
      throw new NotFoundError('Media', mediaId);
    }

    if (!media.mimeType.startsWith('image/')) {
      throw new ValidationError(['Cannot generate thumbnail for non-image media']);
    }

    // In a real implementation, you'd fetch the original image and generate thumbnail
    // For now, return a placeholder
    return `/api/media/${mediaId}/thumbnail`;
  }

  async getMediaById(mediaId: string, userId: string): Promise<IMedia | null> {
    const media = await this.mediaRepository.findById(mediaId);
    if (!media) {
      return null;
    }

    // Check permission
    const canView = await this.permissionService.canAccess(userId, media.treeId, Permission.VIEW_TREE);
    if (!canView) {
      throw new PermissionError('Permission denied');
    }

    return media;
  }

  async getMediaByTreeId(treeId: string, userId: string, type?: MediaType): Promise<IMedia[]> {
    // Check permission
    const canView = await this.permissionService.canAccess(userId, treeId, Permission.VIEW_TREE);
    if (!canView) {
      throw new PermissionError('Permission denied');
    }

    const media = await this.mediaRepository.findByTreeId(treeId, { type });

    return media;
  }

  async getMediaByPersonId(personId: string, userId: string): Promise<IMedia[]> {
    const media = await this.mediaRepository.findByPersonId(personId);

    if (media.length === 0) {
      return [];
    }

    // Check permission for the first media item's tree
    const canView = await this.permissionService.canAccess(userId, media[0].treeId, Permission.VIEW_TREE);
    if (!canView) {
      throw new PermissionError('Permission denied');
    }

    return media;
  }

  async updateMedia(mediaId: string, userId: string, data: UpdateMediaDto): Promise<IMedia> {
    const media = await this.mediaRepository.findById(mediaId);
    if (!media) {
      throw new NotFoundError('Media', mediaId);
    }

    // Check permission
    const canEdit = await this.permissionService.canAccess(userId, media.treeId, Permission.EDIT_TREE);
    if (!canEdit) {
      throw new PermissionError('Permission denied');
    }

    // Update media
    const updated = await this.mediaRepository.update(mediaId, {
      personId: data.personId,
      metadata: {
        ...media.metadata,
        dateTaken: data.dateTaken,
        description: data.description?.trim(),
      },
    });

    // Audit log
    await this.auditLogRepository.create({
      treeId: media.treeId,
      userId,
      action: 'update',
      entityType: 'Media',
      entityId: mediaId,
      changes: [],
    });

    return updated;
  }

  async deleteMedia(mediaId: string, userId: string): Promise<void> {
    const media = await this.mediaRepository.findById(mediaId);
    if (!media) {
      throw new NotFoundError('Media', mediaId);
    }

    // Check permission
    const canDelete = await this.permissionService.canAccess(userId, media.treeId, Permission.EDIT_TREE);
    if (!canDelete) {
      throw new PermissionError('Permission denied');
    }

    // Delete from storage
    const key = this.extractKeyFromUrl(media.url);
    if (key) {
      await this.storageStrategy.delete(key);
    }

    // Delete from database
    await this.mediaRepository.delete(mediaId);

    // Audit log
    await this.auditLogRepository.create({
      treeId: media.treeId,
      userId,
      action: 'delete',
      entityType: 'Media',
      entityId: mediaId,
      changes: [],
    });
  }

  async validateFile(file: Buffer, mimeType: string): Promise<string[]> {
    const errors: string[] = [];

    if (file.length > this.MAX_FILE_SIZE) {
      errors.push(`File too large. Maximum size is ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    if (!this.ALLOWED_MIME_TYPES.includes(mimeType)) {
      errors.push(
        `File type not allowed. Allowed types: ${this.ALLOWED_MIME_TYPES.join(', ')}`
      );
    }

    return errors;
  }

  async getSignedUrl(mediaId: string, userId: string, expiresIn: number = 3600): Promise<string> {
    const media = await this.mediaRepository.findById(mediaId);
    if (!media) {
      throw new NotFoundError('Media', mediaId);
    }

    // Check permission
    const canView = await this.permissionService.canAccess(userId, media.treeId, Permission.VIEW_TREE);
    if (!canView) {
      throw new PermissionError('Permission denied');
    }

    const key = this.extractKeyFromUrl(media.url);
    if (!key) {
      return media.url;
    }

    return this.storageStrategy.getSignedUrl(key, { expiresIn });
  }

  private getMediaType(mimeType: string): MediaType {
    if (mimeType.startsWith('image/')) {
      return 'photo';
    }
    return 'document';
  }

  private async generateThumbnailFromBuffer(imageBuffer: Buffer): Promise<string> {
    // Lazy load sharp only on server side
    const sharp = typeof window === 'undefined' ? require('sharp') : null;
    if (!sharp) {
      throw new Error('Sharp is only available on the server side');
    }

    const thumbnailBuffer = await sharp(imageBuffer)
      .resize(this.THUMBNAIL_WIDTH, this.THUMBNAIL_HEIGHT, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Upload thumbnail to storage
    const uploadResult = await this.storageStrategy.upload(thumbnailBuffer, {
      filename: `thumb_${Date.now()}.jpg`,
      mimeType: 'image/jpeg',
      folder: 'thumbnails',
    });

    return uploadResult.url;
  }

  private extractKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.slice(1); // Remove leading slash
    } catch {
      return null;
    }
  }
}
