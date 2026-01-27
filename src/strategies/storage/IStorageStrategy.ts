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
