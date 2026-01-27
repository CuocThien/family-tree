import { IMedia, MediaType } from '@/types/media';
import { UploadMediaDto, UpdateMediaDto } from '@/types/dtos/media';

export interface MediaUploadResult {
  media: IMedia;
  url: string;
  thumbnailUrl?: string;
}

/**
 * Service interface for Media operations.
 * Handles file uploads, storage, thumbnails, and media metadata.
 */
export interface IMediaService {
  // Upload
  uploadMedia(userId: string, data: UploadMediaDto & { file: Buffer }): Promise<MediaUploadResult>;
  generateThumbnail(mediaId: string): Promise<string>;

  // CRUD
  getMediaById(mediaId: string, userId: string): Promise<IMedia | null>;
  getMediaByTreeId(treeId: string, userId: string, type?: MediaType): Promise<IMedia[]>;
  getMediaByPersonId(personId: string, userId: string): Promise<IMedia[]>;
  updateMedia(mediaId: string, userId: string, data: UpdateMediaDto): Promise<IMedia>;
  deleteMedia(mediaId: string, userId: string): Promise<void>;

  // Validation
  validateFile(file: Buffer, mimeType: string): Promise<string[]>;

  // Storage
  getSignedUrl(mediaId: string, userId: string, expiresIn?: number): Promise<string>;
}
