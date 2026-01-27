import { Db, GridFSBucket, ObjectId } from 'mongodb';
import { Readable } from 'stream';
import sharp from 'sharp';
import { IStorageStrategy, UploadOptions, UploadResult, DownloadResult, SignedUrlOptions, ThumbnailOptions } from './IStorageStrategy';
import crypto from 'crypto';

export class GridFSStorageStrategy implements IStorageStrategy {
  name = 'gridfs';

  private bucket: GridFSBucket;
  private baseUrl: string;

  constructor(db: Db, bucketName: string = 'media', baseUrl: string = '/api/files') {
    this.bucket = new GridFSBucket(db, { bucketName });
    this.baseUrl = baseUrl;
  }

  async upload(file: Buffer | NodeJS.ReadableStream, options: UploadOptions): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const sanitizedFilename = this.sanitizeFilename(options.filename);
      const sanitizedFolder = options.folder ? this.sanitizeFolder(options.folder) : undefined;

      const uploadStream = this.bucket.openUploadStream(sanitizedFilename, {
        metadata: {
          contentType: options.mimeType,
          folder: sanitizedFolder,
          tags: options.tags,
          ...options.metadata,
        },
      } as any);

      const readable = Buffer.isBuffer(file)
        ? Readable.from(file)
        : file as NodeJS.ReadableStream;

      let size = 0;
      readable.on('data', (chunk) => { size += chunk.length; });

      readable.pipe(uploadStream);

      uploadStream.on('finish', () => {
        resolve({
          id: uploadStream.id.toString(),
          url: this.getPublicUrl(uploadStream.id.toString()),
          size,
          mimeType: options.mimeType,
          metadata: options.metadata,
        });
      });

      uploadStream.on('error', reject);
    });
  }

  async download(fileId: string): Promise<DownloadResult> {
    const file = await this.bucket.find({ _id: new ObjectId(fileId) }).next();
    if (!file) {
      throw new Error(`File ${fileId} not found`);
    }

    const metadata = file.metadata as any;
    return {
      stream: this.bucket.openDownloadStream(new ObjectId(fileId)),
      size: file.length,
      mimeType: metadata?.contentType || 'application/octet-stream',
    };
  }

  async delete(fileId: string): Promise<void> {
    await this.bucket.delete(new ObjectId(fileId));
  }

  getPublicUrl(fileId: string): string {
    return `${this.baseUrl}/gridfs/${fileId}`;
  }

  async getSignedUrl(fileId: string, options?: SignedUrlOptions): Promise<string> {
    const expires = Date.now() + (options?.expiresIn || 3600) * 1000;
    const signature = this.generateSignature(fileId, expires);
    return `${this.getPublicUrl(fileId)}?expires=${expires}&sig=${signature}`;
  }

  async generateThumbnail(fileId: string, options: ThumbnailOptions): Promise<UploadResult> {
    const { stream } = await this.download(fileId);

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }
    const buffer = Buffer.concat(chunks);

    const thumbnail = await sharp(buffer)
      .resize(options.width, options.height, { fit: 'cover' })
      .toFormat(options.format || 'jpeg', { quality: options.quality || 80 })
      .toBuffer();

    return this.upload(thumbnail, {
      filename: `thumb_${fileId}.${options.format || 'jpeg'}`,
      mimeType: `image/${options.format || 'jpeg'}`,
      folder: 'thumbnails',
      metadata: { originalId: fileId },
    });
  }

  async exists(fileId: string): Promise<boolean> {
    const file = await this.bucket.find({ _id: new ObjectId(fileId) }).next();
    return file !== null;
  }

  async getMetadata(fileId: string): Promise<Record<string, unknown>> {
    const file = await this.bucket.find({ _id: new ObjectId(fileId) }).next();
    if (!file) {
      throw new Error(`File ${fileId} not found`);
    }
    const metadata = file.metadata as any;
    return {
      filename: file.filename,
      size: file.length,
      contentType: metadata?.contentType,
      uploadDate: file.uploadDate,
      metadata: file.metadata,
    };
  }

  private generateSignature(fileId: string, expires: number): string {
    const secret = process.env.FILE_SIGNING_SECRET;
    if (!secret) {
      throw new Error('FILE_SIGNING_SECRET environment variable is required');
    }
    return crypto
      .createHmac('sha256', secret)
      .update(`${fileId}:${expires}`)
      .digest('hex');
  }

  private sanitizeFilename(filename: string): string {
    // Remove path separators and special characters to prevent injection
    return filename.replace(/[\/\\]/g, '').replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  private sanitizeFolder(folder: string): string {
    // Remove path separators and special characters from folder names
    return folder.replace(/[\/\\]/g, '').replace(/[^a-zA-Z0-9._-]/g, '_');
  }
}
