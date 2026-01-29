import { MediaService } from './MediaService';
import { IMediaService, MediaUploadResult } from './IMediaService';
import { IMediaRepository } from '@/repositories/interfaces/IMediaRepository';
import { IStorageStrategy } from '@/strategies/storage/IStorageStrategy';
import { IPermissionService, Permission } from '@/services/permission/IPermissionService';
import { IAuditRepository } from '@/repositories/interfaces/IAuditRepository';
import { UploadMediaDto, UpdateMediaDto } from '@/types/dtos/media';
import { IMedia, MediaType } from '@/types/media';
import { ValidationError, PermissionError, NotFoundError } from '@/services/errors/ServiceErrors';

describe('MediaService', () => {
  let service: MediaService;
  let mockMediaRepo: jest.Mocked<IMediaRepository>;
  let mockStorageStrategy: jest.Mocked<IStorageStrategy>;
  let mockPermissionService: jest.Mocked<IPermissionService>;
  let mockAuditRepo: jest.Mocked<IAuditRepository>;

  const mockMedia: IMedia = {
    _id: 'media-1',
    treeId: 'tree-1',
    personId: 'person-1',
    type: 'photo',
    filename: 'photo.jpg',
    mimeType: 'image/jpeg',
    size: 1024,
    url: 'https://example.com/photo.jpg',
    metadata: {
      description: 'A photo',
      dateTaken: new Date('2020-01-01'),
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockMediaRepo = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
      findByTreeId: jest.fn(),
      findByPersonId: jest.fn(),
    } as unknown as jest.Mocked<IMediaRepository>;

    mockStorageStrategy = {
      upload: jest.fn(),
      delete: jest.fn(),
      getSignedUrl: jest.fn(),
    } as unknown as jest.Mocked<IStorageStrategy>;

    mockPermissionService = {
      canAccess: jest.fn(),
      getPermissions: jest.fn(),
      getRolePermissions: jest.fn(),
      hasMinimumRole: jest.fn(),
      invalidateCache: jest.fn(),
    } as unknown as jest.Mocked<IPermissionService>;

    mockAuditRepo = {
      create: jest.fn(),
      findByTreeId: jest.fn(),
      findByUserId: jest.fn(),
      findByEntityId: jest.fn(),
      countByTreeId: jest.fn(),
      archiveOlderThan: jest.fn(),
    } as unknown as jest.Mocked<IAuditRepository>;

    service = new MediaService(
      mockMediaRepo,
      mockStorageStrategy,
      mockPermissionService,
      mockAuditRepo
    );
  });

  describe('uploadMedia', () => {
    const validFile = Buffer.from('test image data');
    const validData: UploadMediaDto & { file: Buffer } = {
      treeId: 'tree-1',
      personId: 'person-1',
      filename: 'photo.jpg',
      mimeType: 'image/jpeg',
      file: validFile,
      description: 'A photo',
    };

    it('should upload media successfully', async () => {
      mockStorageStrategy.upload.mockResolvedValue({
        url: 'https://example.com/photo.jpg',
        key: 'tree-1/media/photo.jpg',
      });
      mockPermissionService.canAccess.mockResolvedValue(true);
      mockMediaRepo.create.mockResolvedValue(mockMedia);
      mockAuditRepo.create.mockResolvedValue({} as any);

      const result = await service.uploadMedia('user-1', validData);

      expect(result.media).toEqual(mockMedia);
      expect(result.url).toBe('https://example.com/photo.jpg');
      expect(mockStorageStrategy.upload).toHaveBeenCalled();
    });

    it('should throw ValidationError for file too large', async () => {
      const largeFile = Buffer.alloc(51 * 1024 * 1024); // 51MB
      const largeFileData = { ...validData, file: largeFile };

      await expect(service.uploadMedia('user-1', largeFileData)).rejects.toThrow(
        ValidationError
      );
    });

    it('should throw ValidationError for invalid mime type', async () => {
      mockPermissionService.canAccess.mockResolvedValue(true);
      const invalidData = { ...validData, mimeType: 'video/mp4', file: Buffer.from('video') };

      await expect(service.uploadMedia('user-1', invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw PermissionError when user lacks permission', async () => {
      mockPermissionService.canAccess.mockResolvedValue(false);

      await expect(service.uploadMedia('user-2', validData)).rejects.toThrow(PermissionError);
    });
  });

  describe('generateThumbnail', () => {
    it('should generate thumbnail for image', async () => {
      mockMediaRepo.findById.mockResolvedValue(mockMedia);

      const result = await service.generateThumbnail('media-1');

      expect(result).toContain('thumbnail');
    });

    it('should throw NotFoundError when media not found', async () => {
      mockMediaRepo.findById.mockResolvedValue(null);

      await expect(service.generateThumbnail('nonexistent')).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for non-image media', async () => {
      const documentMedia = { ...mockMedia, mimeType: 'application/pdf', type: 'document' };
      mockMediaRepo.findById.mockResolvedValue(documentMedia);

      await expect(service.generateThumbnail('media-1')).rejects.toThrow(ValidationError);
    });
  });

  describe('getMediaById', () => {
    it('should return media when user has permission', async () => {
      mockMediaRepo.findById.mockResolvedValue(mockMedia);
      mockPermissionService.canAccess.mockResolvedValue(true);

      const result = await service.getMediaById('media-1', 'user-1');

      expect(result).toEqual(mockMedia);
    });

    it('should return null when media not found', async () => {
      mockMediaRepo.findById.mockResolvedValue(null);

      const result = await service.getMediaById('nonexistent', 'user-1');

      expect(result).toBeNull();
    });

    it('should throw PermissionError when user lacks permission', async () => {
      mockMediaRepo.findById.mockResolvedValue(mockMedia);
      mockPermissionService.canAccess.mockResolvedValue(false);

      await expect(service.getMediaById('media-1', 'user-2')).rejects.toThrow(PermissionError);
    });
  });

  describe('getMediaByTreeId', () => {
    it('should return all media for tree', async () => {
      const media = [mockMedia, { ...mockMedia, _id: 'media-2' }];
      mockPermissionService.canAccess.mockResolvedValue(true);
      mockMediaRepo.findByTreeId.mockResolvedValue(media);

      const result = await service.getMediaByTreeId('tree-1', 'user-1');

      expect(result).toHaveLength(2);
    });

    it('should filter by type when specified', async () => {
      mockPermissionService.canAccess.mockResolvedValue(true);
      mockMediaRepo.findByTreeId.mockResolvedValue([mockMedia]);

      const result = await service.getMediaByTreeId('tree-1', 'user-1', 'photo');

      expect(result).toHaveLength(1);
      expect(mockMediaRepo.findByTreeId).toHaveBeenCalledWith('tree-1', { type: 'photo' });
    });

    it('should throw PermissionError when user lacks permission', async () => {
      mockPermissionService.canAccess.mockResolvedValue(false);

      await expect(service.getMediaByTreeId('tree-1', 'user-2')).rejects.toThrow(
        PermissionError
      );
    });
  });

  describe('getMediaByPersonId', () => {
    it('should return media for person', async () => {
      mockMediaRepo.findByPersonId.mockResolvedValue([mockMedia]);
      mockPermissionService.canAccess.mockResolvedValue(true);

      const result = await service.getMediaByPersonId('person-1', 'user-1');

      expect(result).toHaveLength(1);
    });

    it('should return empty array when no media found', async () => {
      mockMediaRepo.findByPersonId.mockResolvedValue([]);

      const result = await service.getMediaByPersonId('person-1', 'user-1');

      expect(result).toEqual([]);
    });
  });

  describe('updateMedia', () => {
    const updateData: UpdateMediaDto = {
      description: 'Updated description',
      dateTaken: new Date('2021-01-01'),
    };

    it('should update media when user has permission', async () => {
      mockMediaRepo.findById.mockResolvedValue(mockMedia);
      mockPermissionService.canAccess.mockResolvedValue(true);
      mockMediaRepo.update.mockResolvedValue({
        ...mockMedia,
        metadata: { description: 'Updated description', dateTaken: new Date('2021-01-01') },
      });
      mockAuditRepo.create.mockResolvedValue({} as any);

      const result = await service.updateMedia('media-1', 'user-1', updateData);

      expect(mockMediaRepo.update).toHaveBeenCalled();
    });

    it('should throw NotFoundError when media not found', async () => {
      mockMediaRepo.findById.mockResolvedValue(null);

      await expect(service.updateMedia('nonexistent', 'user-1', updateData)).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw PermissionError when user lacks permission', async () => {
      mockMediaRepo.findById.mockResolvedValue(mockMedia);
      mockPermissionService.canAccess.mockResolvedValue(false);

      await expect(service.updateMedia('media-1', 'user-2', updateData)).rejects.toThrow(
        PermissionError
      );
    });
  });

  describe('deleteMedia', () => {
    it('should delete media when user has permission', async () => {
      mockMediaRepo.findById.mockResolvedValue(mockMedia);
      mockPermissionService.canAccess.mockResolvedValue(true);
      mockStorageStrategy.delete.mockResolvedValue(undefined);
      mockMediaRepo.delete.mockResolvedValue(undefined);
      mockAuditRepo.create.mockResolvedValue({} as any);

      await service.deleteMedia('media-1', 'user-1');

      expect(mockStorageStrategy.delete).toHaveBeenCalled();
      expect(mockMediaRepo.delete).toHaveBeenCalledWith('media-1');
    });

    it('should throw NotFoundError when media not found', async () => {
      mockMediaRepo.findById.mockResolvedValue(null);

      await expect(service.deleteMedia('nonexistent', 'user-1')).rejects.toThrow(NotFoundError);
    });

    it('should throw PermissionError when user lacks permission', async () => {
      mockMediaRepo.findById.mockResolvedValue(mockMedia);
      mockPermissionService.canAccess.mockResolvedValue(false);

      await expect(service.deleteMedia('media-1', 'user-2')).rejects.toThrow(PermissionError);
    });
  });

  describe('validateFile', () => {
    it('should return empty array for valid file', async () => {
      const validFile = Buffer.from('test');
      const result = await service.validateFile(validFile, 'image/jpeg');

      expect(result).toEqual([]);
    });

    it('should return error for file too large', async () => {
      const largeFile = Buffer.alloc(51 * 1024 * 1024);
      const result = await service.validateFile(largeFile, 'image/jpeg');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toContain('File too large');
    });

    it('should return error for invalid mime type', async () => {
      const file = Buffer.from('test');
      const result = await service.validateFile(file, 'video/mp4');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toContain('File type not allowed');
    });
  });

  describe('getSignedUrl', () => {
    it('should return signed url for media', async () => {
      mockMediaRepo.findById.mockResolvedValue(mockMedia);
      mockPermissionService.canAccess.mockResolvedValue(true);
      mockStorageStrategy.getSignedUrl.mockResolvedValue('https://example.com/signed-url');

      const result = await service.getSignedUrl('media-1', 'user-1', 3600);

      expect(result).toBe('https://example.com/signed-url');
    });

    it('should throw NotFoundError when media not found', async () => {
      mockMediaRepo.findById.mockResolvedValue(null);

      await expect(service.getSignedUrl('nonexistent', 'user-1')).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw PermissionError when user lacks permission', async () => {
      mockMediaRepo.findById.mockResolvedValue(mockMedia);
      mockPermissionService.canAccess.mockResolvedValue(false);

      await expect(service.getSignedUrl('media-1', 'user-2')).rejects.toThrow(PermissionError);
    });

    it('should return original url when key extraction fails', async () => {
      const mediaWithInvalidUrl = { ...mockMedia, url: 'invalid-url' };
      mockMediaRepo.findById.mockResolvedValue(mediaWithInvalidUrl);
      mockPermissionService.canAccess.mockResolvedValue(true);

      const result = await service.getSignedUrl('media-1', 'user-1');

      expect(result).toBe('invalid-url');
    });
  });
});
