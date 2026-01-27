import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import { IStorageStrategy, UploadOptions, UploadResult, DownloadResult, SignedUrlOptions, ThumbnailOptions } from './IStorageStrategy';

export class CloudinaryStorageStrategy implements IStorageStrategy {
  name = 'cloudinary';

  constructor(config: { cloudName: string; apiKey: string; apiSecret: string }) {
    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
    });
  }

  async upload(file: Buffer | NodeJS.ReadableStream, options: UploadOptions): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder: options.folder || 'family-tree',
        resource_type: this.getResourceType(options.mimeType),
        public_id: this.generatePublicId(options.filename),
        tags: options.tags,
        context: options.metadata,
      };

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions as any,
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              id: result.public_id,
              url: result.secure_url,
              size: result.bytes,
              mimeType: options.mimeType,
              metadata: { format: String(result.format), width: String(result.width), height: String(result.height) },
            });
          }
        }
      );

      if (Buffer.isBuffer(file)) {
        Readable.from(file).pipe(uploadStream);
      } else {
        (file as NodeJS.ReadableStream).pipe(uploadStream);
      }
    });
  }

  async download(fileId: string): Promise<DownloadResult> {
    const url = cloudinary.url(fileId, { secure: true });
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);

    return {
      stream: Readable.fromWeb(response.body as any),
      size: contentLength,
      mimeType: contentType,
    };
  }

  async delete(fileId: string): Promise<void> {
    await cloudinary.uploader.destroy(fileId);
  }

  getPublicUrl(fileId: string): string {
    return cloudinary.url(fileId, { secure: true });
  }

  async getSignedUrl(fileId: string, options?: SignedUrlOptions): Promise<string> {
    const expireAt = Math.floor(Date.now() / 1000) + (options?.expiresIn || 3600);

    return cloudinary.url(fileId, {
      secure: true,
      sign_url: true,
      type: 'authenticated',
      expires_at: expireAt,
    });
  }

  async generateThumbnail(fileId: string, options: ThumbnailOptions): Promise<UploadResult> {
    const thumbnailUrl = cloudinary.url(fileId, {
      secure: true,
      transformation: [
        { width: options.width, height: options.height, crop: 'fill' },
        { quality: options.quality || 80 },
        { format: options.format || 'jpeg' },
      ],
    });

    return {
      id: `${fileId}_thumb_${options.width}x${options.height}`,
      url: thumbnailUrl,
      size: 0,
      mimeType: `image/${options.format || 'jpeg'}`,
    };
  }

  async exists(fileId: string): Promise<boolean> {
    try {
      await cloudinary.api.resource(fileId);
      return true;
    } catch {
      return false;
    }
  }

  async getMetadata(fileId: string): Promise<Record<string, unknown>> {
    const result = await cloudinary.api.resource(fileId);
    return {
      filename: result.original_filename,
      size: result.bytes,
      format: result.format,
      width: result.width,
      height: result.height,
      createdAt: result.created_at,
      url: result.secure_url,
    };
  }

  private getResourceType(mimeType: string): 'image' | 'video' | 'raw' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'raw';
  }

  private generatePublicId(filename: string): string {
    const name = filename.replace(/\.[^/.]+$/, '');
    const timestamp = Date.now();
    return `${name}_${timestamp}`;
  }
}
