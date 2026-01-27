# Task 11: Create Storage Strategies

**Phase:** 5 - Strategy Pattern (Storage)
**Priority:** Medium
**Dependencies:** Task 08 (Service Interfaces)
**Estimated Complexity:** Medium

---

## Objective

Implement storage strategies for media file management. Support multiple storage backends (Local, GridFS, Cloudinary, S3) using Strategy Pattern for flexibility and testability.

---

## Prerequisites

### Docker Infrastructure Setup

Before implementing storage strategies, set up Docker containers for storage backends:

#### 1. Docker Compose Configuration

**File:** `docker-compose.storage.yml`

```yaml
version: '3.8'

services:
  # MongoDB for GridFS storage strategy
  mongodb:
    image: mongo:7.0
    container_name: family-tree-mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
      MONGO_INITDB_DATABASE: familytree
    volumes:
      - mongodb_data:/data/db
      - mongodb_config:/data/configdb
    networks:
      - storage-network

  # MinIO for S3-compatible storage strategy
  minio:
    image: minio/minio:latest
    container_name: family-tree-minio
    restart: unless-stopped
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
    networks:
      - storage-network

  # MinIO Client for bucket initialization
  minio-init:
    image: minio/mc:latest
    container_name: family-tree-minio-init
    depends_on:
      - minio
    entrypoint: >
      /bin/sh -c "
      sleep 5;
      /usr/bin/mc alias set myminio http://minio:9000 minioadmin minioadmin123;
      /usr/bin/mc mb myminio/family-tree --ignore-existing;
      /usr/bin/mc policy set public myminio/family-tree;
      exit 0;
      "
    networks:
      - storage-network

volumes:
  mongodb_data:
    driver: local
  mongodb_config:
    driver: local
  minio_data:
    driver: local

networks:
  storage-network:
    driver: bridge
```

#### 2. Environment Variables

**File:** `.env.storage.example`

```bash
# MongoDB Configuration (for GridFS)
MONGODB_URI=mongodb://admin:password@localhost:27017/familytree?authSource=admin

# MinIO/S3 Configuration (for S3StorageStrategy)
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET=family-tree
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin123

# Local Storage Configuration
LOCAL_STORAGE_PATH=./uploads
LOCAL_STORAGE_BASE_URL=/api/files

# File Signing Secret (for signed URLs)
FILE_SIGNING_SECRET=your-super-secret-key-change-this-in-production

# Cloudinary Configuration (optional - for CloudinaryStorageStrategy)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

#### 3. Setup Commands

```bash
# Start storage services
docker-compose -f docker-compose.storage.yml up -d

# View logs
docker-compose -f docker-compose.storage.yml logs -f

# Stop services
docker-compose -f docker-compose.storage.yml down

# Remove volumes (WARNING: deletes all data)
docker-compose -f docker-compose.storage.yml down -v
```

#### 4. Verify Services

```bash
# Check MongoDB connection
mongosh "mongodb://admin:password@localhost:27017/familytree?authSource=admin"

# Check MinIO console
open http://localhost:9001
# Username: minioadmin
# Password: minioadmin123

# Check MinIO API
curl http://localhost:9000
```

---

## Requirements

### Functional Requirements

1. Define IStorageStrategy interface
2. Implement 4 storage strategies:
   - LocalStorageStrategy (development)
   - GridFSStorageStrategy (MongoDB GridFS)
   - CloudinaryStorageStrategy (cloud image service)
   - S3StorageStrategy (AWS S3)
3. Support file upload, download, delete, and URL generation
4. Handle thumbnails and image optimization

### Non-Functional Requirements

1. Strategies must be thread-safe
2. Support streaming for large files
3. Implement retry logic for cloud services
4. Handle connection failures gracefully
5. Secure signed URLs with expiration

---

## Interface Definition

**File:** `src/strategies/storage/IStorageStrategy.ts`

```typescript
export interface UploadOptions {
  filename: string;
  mimeType: string;
  folder?: string;
  metadata?: Record<string, string>;
  tags?: string[];
}

export interface UploadResult {
  id: string;
  url: string;
  size: number;
  mimeType: string;
  metadata?: Record<string, string>;
}

export interface DownloadResult {
  stream: NodeJS.ReadableStream;
  size: number;
  mimeType: string;
}

export interface SignedUrlOptions {
  expiresIn?: number; // seconds, default 3600
  disposition?: 'inline' | 'attachment';
}

export interface ThumbnailOptions {
  width: number;
  height: number;
  format?: 'jpeg' | 'png' | 'webp';
  quality?: number;
}

export interface IStorageStrategy {
  name: string;

  // Core operations
  upload(file: Buffer | NodeJS.ReadableStream, options: UploadOptions): Promise<UploadResult>;
  download(fileId: string): Promise<DownloadResult>;
  delete(fileId: string): Promise<void>;

  // URL generation
  getPublicUrl(fileId: string): string;
  getSignedUrl(fileId: string, options?: SignedUrlOptions): Promise<string>;

  // Image processing
  generateThumbnail(fileId: string, options: ThumbnailOptions): Promise<UploadResult>;

  // Utilities
  exists(fileId: string): Promise<boolean>;
  getMetadata(fileId: string): Promise<Record<string, unknown>>;
}
```

---

## Strategy Implementations

### 1. LocalStorageStrategy

**File:** `src/strategies/storage/LocalStorageStrategy.ts`

```typescript
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
    const ext = path.extname(options.filename);
    const folder = options.folder || 'general';
    const filePath = path.join(this.basePath, folder, `${id}${ext}`);

    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Write file
    if (Buffer.isBuffer(file)) {
      await fs.writeFile(filePath, file);
    } else {
      await this.streamToFile(file, filePath);
    }

    const stats = await fs.stat(filePath);

    // Store metadata
    await this.saveMetadata(id, {
      filename: options.filename,
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
      mimeType: metadata.mimeType,
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
    // For local storage, generate a simple signed token
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
    const secret = process.env.FILE_SIGNING_SECRET || 'default-secret';
    return crypto
      .createHmac('sha256', secret)
      .update(`${fileId}:${expires}`)
      .digest('hex')
      .substring(0, 16);
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
}
```

### 2. GridFSStorageStrategy

**File:** `src/strategies/storage/GridFSStorageStrategy.ts`

```typescript
import { Db, GridFSBucket, ObjectId } from 'mongodb';
import { Readable } from 'stream';
import sharp from 'sharp';
import { IStorageStrategy, UploadOptions, UploadResult, DownloadResult, SignedUrlOptions, ThumbnailOptions } from './IStorageStrategy';

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
      const uploadStream = this.bucket.openUploadStream(options.filename, {
        contentType: options.mimeType,
        metadata: {
          folder: options.folder,
          tags: options.tags,
          ...options.metadata,
        },
      });

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

    return {
      stream: this.bucket.openDownloadStream(new ObjectId(fileId)),
      size: file.length,
      mimeType: file.contentType || 'application/octet-stream',
    };
  }

  async delete(fileId: string): Promise<void> {
    await this.bucket.delete(new ObjectId(fileId));
  }

  getPublicUrl(fileId: string): string {
    return `${this.baseUrl}/gridfs/${fileId}`;
  }

  async getSignedUrl(fileId: string, options?: SignedUrlOptions): Promise<string> {
    // GridFS uses API routes, generate signed token
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
    return {
      filename: file.filename,
      size: file.length,
      contentType: file.contentType,
      uploadDate: file.uploadDate,
      ...file.metadata,
    };
  }

  private generateSignature(fileId: string, expires: number): string {
    const crypto = require('crypto');
    const secret = process.env.FILE_SIGNING_SECRET || 'default-secret';
    return crypto
      .createHmac('sha256', secret)
      .update(`${fileId}:${expires}`)
      .digest('hex')
      .substring(0, 16);
  }
}
```

### 3. CloudinaryStorageStrategy

**File:** `src/strategies/storage/CloudinaryStorageStrategy.ts`

```typescript
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
              metadata: { format: result.format, width: result.width, height: result.height },
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
    // Cloudinary handles transformations on-the-fly
    const thumbnailUrl = cloudinary.url(fileId, {
      secure: true,
      transformation: [
        { width: options.width, height: options.height, crop: 'fill' },
        { quality: options.quality || 80 },
        { format: options.format || 'jpeg' },
      ],
    });

    // For consistency, we return the transformed URL as a "new" upload result
    return {
      id: `${fileId}_thumb_${options.width}x${options.height}`,
      url: thumbnailUrl,
      size: 0, // Unknown until fetched
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
    const name = filename.replace(/\.[^/.]+$/, ''); // Remove extension
    const timestamp = Date.now();
    return `${name}_${timestamp}`;
  }
}
```

### 4. S3StorageStrategy

**File:** `src/strategies/storage/S3StorageStrategy.ts`

```typescript
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

  constructor(config: { region: string; bucket: string; accessKeyId: string; secretAccessKey: string }) {
    this.client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    this.bucket = config.bucket;
    this.region = config.region;
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
```

---

## Storage Strategy Registry

**File:** `src/strategies/storage/StorageStrategyRegistry.ts`

```typescript
import { IStorageStrategy } from './IStorageStrategy';

export class StorageStrategyRegistry {
  private strategies: Map<string, IStorageStrategy> = new Map();
  private defaultStrategy: string = 'local';

  register(strategy: IStorageStrategy): void {
    this.strategies.set(strategy.name, strategy);
  }

  get(name?: string): IStorageStrategy {
    const strategyName = name || this.defaultStrategy;
    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      throw new Error(`Storage strategy '${strategyName}' not found`);
    }
    return strategy;
  }

  setDefault(name: string): void {
    if (!this.strategies.has(name)) {
      throw new Error(`Cannot set default: strategy '${name}' not registered`);
    }
    this.defaultStrategy = name;
  }

  getAll(): IStorageStrategy[] {
    return Array.from(this.strategies.values());
  }
}
```

---

## Edge Cases

| Edge Case | Handling |
|-----------|----------|
| File too large | Throw error with size limit message |
| Invalid MIME type | Reject with allowed types list |
| Network timeout | Retry with exponential backoff |
| Partial upload | Clean up incomplete files |
| Duplicate filenames | Generate unique IDs |
| Missing file | Throw NotFoundError |
| Corrupted image | Fail thumbnail generation gracefully |
| Expired signed URL | Return 403, client must refresh |

---

## Acceptance Criteria

### Infrastructure
- [ ] Docker Compose configuration created
- [ ] Environment variables template created
- [ ] MongoDB container running and accessible
- [ ] MinIO container running and accessible
- [ ] Services verified healthy

### Implementation
- [ ] IStorageStrategy interface defined
- [ ] LocalStorageStrategy implemented
- [ ] GridFSStorageStrategy implemented
- [ ] CloudinaryStorageStrategy implemented
- [ ] S3StorageStrategy implemented
- [ ] StorageStrategyRegistry created
- [ ] Thumbnail generation working
- [ ] Signed URL generation working
- [ ] Unit tests for each strategy
- [ ] Integration tests with real services
- [ ] TypeScript compilation succeeds
