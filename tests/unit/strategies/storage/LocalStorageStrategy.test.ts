import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { LocalStorageStrategy } from '../../../../src/strategies/storage/LocalStorageStrategy';
import { IStorageStrategy, UploadOptions } from '../../../../src/strategies/storage/IStorageStrategy';
import fs from 'fs/promises';
import path from 'path';

describe('LocalStorageStrategy', () => {
  let strategy: LocalStorageStrategy;
  let testDir: string;

  beforeEach(() => {
    testDir = `/tmp/test-storage-${Date.now()}`;
    strategy = new LocalStorageStrategy(testDir, '/api/files');
    process.env.FILE_SIGNING_SECRET = 'test-secret-key';
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
    delete process.env.FILE_SIGNING_SECRET;
  });

  describe('upload', () => {
    it('should upload a buffer file successfully', async () => {
      const file = Buffer.from('test content');
      const options: UploadOptions = {
        filename: 'test.txt',
        mimeType: 'text/plain',
        folder: 'test',
      };

      const result = await strategy.upload(file, options);

      expect(result.id).toBeDefined();
      expect(result.url).toContain('/api/files/');
      expect(result.size).toBe(12);
      expect(result.mimeType).toBe('text/plain');
    });

    it('should upload to default folder when none specified', async () => {
      const file = Buffer.from('test content');
      const options: UploadOptions = {
        filename: 'test.txt',
        mimeType: 'text/plain',
      };

      const result = await strategy.upload(file, options);

      expect(result.id).toBeDefined();
      const metadata = await strategy.getMetadata(result.id);
      expect(metadata.folder).toBe('general');
    });

    it('should sanitize filename to prevent path traversal', async () => {
      const file = Buffer.from('test content');
      const options: UploadOptions = {
        filename: '../../../malicious.txt',
        mimeType: 'text/plain',
      };

      const result = await strategy.upload(file, options);

      expect(result.id).toBeDefined();
      const metadata = await strategy.getMetadata(result.id);
      // Path separators should be removed
      expect(metadata.filename).not.toContain('/');
      expect(metadata.filename).not.toContain('\\');
      // The .txt extension should still be there
      expect(metadata.filename).toContain('.txt');
    });
  });

  describe('download', () => {
    it('should download a previously uploaded file', async () => {
      const file = Buffer.from('test content for download');
      const options: UploadOptions = {
        filename: 'download-test.txt',
        mimeType: 'text/plain',
      };

      const uploadResult = await strategy.upload(file, options);
      const downloadResult = await strategy.download(uploadResult.id);

      expect(downloadResult.size).toBe(file.length);
      expect(downloadResult.mimeType).toBe('text/plain');

      const chunks: Buffer[] = [];
      for await (const chunk of downloadResult.stream) {
        chunks.push(chunk as Buffer);
      }
      const downloadedBuffer = Buffer.concat(chunks);
      expect(downloadedBuffer.toString()).toBe('test content for download');
    });

    it('should throw error for non-existent file', async () => {
      await expect(strategy.download('non-existent-id')).rejects.toThrow('File non-existent-id not found');
    });
  });

  describe('delete', () => {
    it('should delete an existing file', async () => {
      const file = Buffer.from('content to delete');
      const options: UploadOptions = {
        filename: 'delete-test.txt',
        mimeType: 'text/plain',
      };

      const uploadResult = await strategy.upload(file, options);
      await strategy.delete(uploadResult.id);

      const exists = await strategy.exists(uploadResult.id);
      expect(exists).toBe(false);
    });

    it('should not throw when deleting non-existent file', async () => {
      await expect(strategy.delete('non-existent-id')).resolves.not.toThrow();
    });
  });

  describe('getPublicUrl', () => {
    it('should generate public URL', () => {
      const url = strategy.getPublicUrl('file-id-123');
      expect(url).toBe('/api/files/file-id-123');
    });
  });

  describe('getSignedUrl', () => {
    it('should generate signed URL with expiration', async () => {
      const url = await strategy.getSignedUrl('file-id-123', { expiresIn: 3600 });
      expect(url).toContain('/api/files/file-id-123?');
      expect(url).toContain('expires=');
      expect(url).toContain('sig=');
    });

    it('should throw error when FILE_SIGNING_SECRET is not set', async () => {
      delete process.env.FILE_SIGNING_SECRET;
      await expect(strategy.getSignedUrl('file-id-123')).rejects.toThrow('FILE_SIGNING_SECRET environment variable is required');
    });
  });

  describe('exists', () => {
    it('should return true for existing file', async () => {
      const file = Buffer.from('test content');
      const options: UploadOptions = {
        filename: 'exists-test.txt',
        mimeType: 'text/plain',
      };

      const uploadResult = await strategy.upload(file, options);
      const exists = await strategy.exists(uploadResult.id);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      const exists = await strategy.exists('non-existent-id');
      expect(exists).toBe(false);
    });
  });

  describe('getMetadata', () => {
    it('should return file metadata', async () => {
      const file = Buffer.from('test content');
      const options: UploadOptions = {
        filename: 'metadata-test.txt',
        mimeType: 'text/plain',
        folder: 'test-folder',
        metadata: { key: 'value' },
      };

      const uploadResult = await strategy.upload(file, options);
      const metadata = await strategy.getMetadata(uploadResult.id);

      expect(metadata.filename).toBe('metadata-test.txt');
      expect(metadata.mimeType).toBe('text/plain');
      expect(metadata.folder).toBe('test-folder');
      expect(metadata.size).toBe(12);
      expect(metadata.metadata).toEqual({ key: 'value' });
    });

    it('should throw error for non-existent file', async () => {
      await expect(strategy.getMetadata('non-existent-id')).rejects.toThrow('File non-existent-id not found');
    });
  });

  describe('generateThumbnail', () => {
    it('should generate thumbnail for image', async () => {
      // Create a simple 100x100 red PNG buffer
      const svgBuffer = Buffer.from(
        `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="red"/>
        </svg>`
      );

      const options: UploadOptions = {
        filename: 'test.svg',
        mimeType: 'image/svg+xml',
      };

      const uploadResult = await strategy.upload(svgBuffer, options);
      const thumbnail = await strategy.generateThumbnail(uploadResult.id, {
        width: 50,
        height: 50,
        format: 'jpeg',
      });

      expect(thumbnail.id).toBeDefined();
      expect(thumbnail.url).toContain('/api/files/');
      expect(thumbnail.mimeType).toBe('image/jpeg');
    });
  });
});
