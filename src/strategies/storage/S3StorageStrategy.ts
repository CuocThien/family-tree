import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import sharp from 'sharp';
import crypto from 'crypto';
import { IStorageStrategy, UploadOptions, UploadResult, DownloadResult, SignedUrlOptions, ThumbnailOptions } from './IStorageStrategy';

export class S3StorageStrategy implements IStorageStrategy {
  name = 's3';

  private client: S3Client;
  private bucket: string;
  private region: string;
  private endpoint?: string;

  constructor(config: { region: string; bucket: string; accessKeyId: string; secretAccessKey: string; endpoint?: string }) {
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: !!config.endpoint, // Required for MinIO
    });
    this.bucket = config.bucket;
    this.region = config.region;
    this.endpoint = config.endpoint;
  }

  async upload(file: Buffer | NodeJS.ReadableStream, options: UploadOptions): Promise<UploadResult> {
    const key = this.generateKey(options);

    let body: Buffer;
    if (Buffer.isBuffer(file)) {
      body = file;
    } else {
      const chunks: Buffer[] = [];
      for await (const chunk of file as NodeJS.ReadableStream) {
        chunks.push(chunk as Buffer);
      }
      body = Buffer.concat(chunks);
    }

    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: options.mimeType,
      Metadata: options.metadata,
      Tagging: options.tags?.map(t => `${t}=true`).join('&'),
    }));

    return {
      id: key,
      url: this.getPublicUrl(key),
      size: body.length,
      mimeType: options.mimeType,
      metadata: options.metadata,
    };
  }

  async download(fileId: string): Promise<DownloadResult> {
    const response = await this.client.send(new GetObjectCommand({
      Bucket: this.bucket,
      Key: fileId,
    }));

    if (!response.Body) {
      throw new Error(`File ${fileId} not found`);
    }

    return {
      stream: response.Body as NodeJS.ReadableStream,
      size: response.ContentLength || 0,
      mimeType: response.ContentType || 'application/octet-stream',
    };
  }

  async delete(fileId: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: fileId,
    }));
  }

  getPublicUrl(fileId: string): string {
    if (this.endpoint) {
      // For MinIO or other S3-compatible services
      const url = new URL(this.endpoint);
      return `${url.protocol}//${this.bucket}.${url.host}/${fileId}`;
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${fileId}`;
  }

  async getSignedUrl(fileId: string, options?: SignedUrlOptions): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: fileId,
      ResponseContentDisposition: options?.disposition === 'attachment'
        ? 'attachment'
        : 'inline',
    });

    return getSignedUrl(this.client, command, {
      expiresIn: options?.expiresIn || 3600,
    });
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

    const thumbKey = `thumbnails/${fileId.split('/').pop()}_${options.width}x${options.height}.${options.format || 'jpeg'}`;

    return this.upload(thumbnail, {
      filename: thumbKey,
      mimeType: `image/${options.format || 'jpeg'}`,
      folder: 'thumbnails',
      metadata: { originalKey: fileId },
    });
  }

  async exists(fileId: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({
        Bucket: this.bucket,
        Key: fileId,
      }));
      return true;
    } catch {
      return false;
    }
  }

  async getMetadata(fileId: string): Promise<Record<string, unknown>> {
    const response = await this.client.send(new HeadObjectCommand({
      Bucket: this.bucket,
      Key: fileId,
    }));

    return {
      size: response.ContentLength,
      contentType: response.ContentType,
      lastModified: response.LastModified,
      metadata: response.Metadata,
    };
  }

  private generateKey(options: UploadOptions): string {
    const folder = options.folder || 'uploads';
    const id = crypto.randomBytes(16).toString('hex');
    const ext = options.filename.split('.').pop();
    return `${folder}/${id}.${ext}`;
  }
}
