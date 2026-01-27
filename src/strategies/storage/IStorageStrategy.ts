/**
 * Interface for storage strategies (local, S3, etc.)
 */
export interface IStorageStrategy {
  upload(file: Buffer, options: UploadOptions): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
}

export interface UploadOptions {
  filename: string;
  mimeType: string;
  folder?: string;
}

export interface UploadResult {
  key: string;
  url: string;
}
