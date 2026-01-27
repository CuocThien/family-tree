import fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { IStorageStrategy, UploadOptions, UploadResult, DownloadResult, SignedUrlOptions, ThumbnailOptions } from './IStorageStrategy';

export class LocalStorageStrategy implements IStorageStrategy {
  name = 'local';

  private readonly basePath: string;
  private readonly baseUrl: string;

  constructor(basePath: string = './uploads', baseUrl: string = '/api/files') {
    this.basePath = basePath;
    this.baseUrl = baseUrl;
  }

  async upload(file: Buffer | NodeJS.ReadableStream, options: UploadOptions): Promise<UploadResult> {
    const id = this.generateId();
    const sanitizedFilename = this.sanitizeFilename(options.filename);
    const ext = path.extname(sanitizedFilename);
    const folder = this.sanitizeFolder(options.folder || 'general');
    const filePath = path.join(this.basePath, folder, `${id}${ext}`);

    await fs.mkdir(path.dirname(filePath), { recursive: true });

    if (Buffer.isBuffer(file)) {
      await fs.writeFile(filePath, file);
    } else {
      await this.streamToFile(file, filePath);
    }

    const stats = await fs.stat(filePath);

    await this.saveMetadata(id, {
      filename: sanitizedFilename,
      mimeType: options.mimeType,
      folder,
      ext,
      size: stats.size,
      metadata: options.metadata,
      createdAt: new Date().toISOString(),
    });

    return {
      id,
      url: this.getPublicUrl(id),
      size: stats.size,
      mimeType: options.mimeType,
    };
  }

  async download(fileId: string): Promise<DownloadResult> {
    const metadata = await this.loadMetadata(fileId);
    if (!metadata) {
      throw new Error(`File ${fileId} not found`);
    }

    const filePath = this.getFilePath(fileId, metadata);
    const stats = await fs.stat(filePath);

    return {
      stream: createReadStream(filePath),
      size: stats.size,
      mimeType: metadata.mimeType as string,
    };
  }

  async delete(fileId: string): Promise<void> {
    const metadata = await this.loadMetadata(fileId);
    if (!metadata) return;

    const filePath = this.getFilePath(fileId, metadata);

    await Promise.all([
      fs.unlink(filePath).catch(() => {}),
      fs.unlink(this.getMetadataPath(fileId)).catch(() => {}),
    ]);
  }

  getPublicUrl(fileId: string): string {
    return `${this.baseUrl}/${fileId}`;
  }

  async getSignedUrl(fileId: string, options?: SignedUrlOptions): Promise<string> {
    const expires = Date.now() + (options?.expiresIn || 3600) * 1000;
    const signature = this.generateSignature(fileId, expires);
    return `${this.getPublicUrl(fileId)}?expires=${expires}&sig=${signature}`;
  }

  async generateThumbnail(fileId: string, options: ThumbnailOptions): Promise<UploadResult> {
    const { stream, mimeType } = await this.download(fileId);

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
    });
  }

  async exists(fileId: string): Promise<boolean> {
    const metadata = await this.loadMetadata(fileId);
    return metadata !== null;
  }

  async getMetadata(fileId: string): Promise<Record<string, unknown>> {
    const metadata = await this.loadMetadata(fileId);
    if (!metadata) {
      throw new Error(`File ${fileId} not found`);
    }
    return metadata;
  }

  private generateId(): string {
    return crypto.randomBytes(16).toString('hex');
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

  private getFilePath(fileId: string, metadata: Record<string, unknown>): string {
    return path.join(this.basePath, metadata.folder as string, `${fileId}${metadata.ext}`);
  }

  private getMetadataPath(fileId: string): string {
    return path.join(this.basePath, '.metadata', `${fileId}.json`);
  }

  private async saveMetadata(fileId: string, metadata: Record<string, unknown>): Promise<void> {
    const metaPath = this.getMetadataPath(fileId);
    await fs.mkdir(path.dirname(metaPath), { recursive: true });
    await fs.writeFile(metaPath, JSON.stringify(metadata, null, 2));
  }

  private async loadMetadata(fileId: string): Promise<Record<string, unknown> | null> {
    try {
      const content = await fs.readFile(this.getMetadataPath(fileId), 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  private streamToFile(stream: NodeJS.ReadableStream, filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const writeStream = createWriteStream(filePath);
      stream.pipe(writeStream);
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
  }

  private sanitizeFilename(filename: string): string {
    // Remove path separators and special characters to prevent path traversal
    return filename.replace(/[\/\\]/g, '').replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  private sanitizeFolder(folder: string): string {
    // Remove path separators and special characters from folder names
    return folder.replace(/[\/\\]/g, '').replace(/[^a-zA-Z0-9._-]/g, '_');
  }
}
