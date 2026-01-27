import { PermissionService } from './PermissionService';
import { IPermissionService, Permission } from './IPermissionService';
import { ITreeRepository } from '@/repositories/interfaces/ITreeRepository';
import { IUserRepository } from '@/repositories/interfaces/IUserRepository';
import { ITree } from '@/types/tree';

describe('PermissionService', () => {
  let service: PermissionService;
  let mockTreeRepo: jest.Mocked<ITreeRepository>;
  let mockUserRepo: jest.Mocked<IUserRepository>;

  const mockTree: ITree = {
    _id: 'tree-1',
    ownerId: 'owner-1',
    name: 'Test Tree',
    collaborators: [
      { userId: 'editor-1', permission: 'editor', addedAt: new Date() },
      { userId: 'viewer-1', permission: 'viewer', addedAt: new Date() },
    ],
    settings: {
      isPublic: false,
      allowComments: false,
      defaultPhotoQuality: 'medium',
      language: 'en',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockTreeRepo = {
      findById: jest.fn(),
      isOwner: jest.fn(),
      hasAccess: jest.fn(),
    } as unknown as jest.Mocked<ITreeRepository>;

    mockUserRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      updatePassword: jest.fn(),
      verifyEmail: jest.fn(),
      addTree: jest.fn(),
      removeTree: jest.fn(),
      exists: jest.fn(),
      emailExists: jest.fn(),
    } as unknown as jest.Mocked<IUserRepository>;

    service = new PermissionService(mockTreeRepo, mockUserRepo);
  });

  describe('canAccess', () => {
    it('should grant all permissions to owner', async () => {
      mockTreeRepo.findById.mockResolvedValue(mockTree);

      const result = await service.canAccess('owner-1', 'tree-1', Permission.DELETE_TREE);

      expect(result).toBe(true);
    });

    it('should grant editor permissions to editor role', async () => {
      mockTreeRepo.findById.mockResolvedValue(mockTree);

      const result = await service.canAccess('editor-1', 'tree-1', Permission.EDIT_TREE);

      expect(result).toBe(true);
    });

    it('should deny delete permissions to editor role', async () => {
      mockTreeRepo.findById.mockResolvedValue(mockTree);

      const result = await service.canAccess('editor-1', 'tree-1', Permission.DELETE_TREE);

      expect(result).toBe(false);
    });

    it('should grant view permissions to viewer role', async () => {
      mockTreeRepo.findById.mockResolvedValue(mockTree);

      const result = await service.canAccess('viewer-1', 'tree-1', Permission.VIEW_TREE);

      expect(result).toBe(true);
    });

    it('should deny edit permissions to viewer role', async () => {
      mockTreeRepo.findById.mockResolvedValue(mockTree);

      const result = await service.canAccess('viewer-1', 'tree-1', Permission.EDIT_TREE);

      expect(result).toBe(false);
    });

    it('should deny access to non-collaborators on private tree', async () => {
      mockTreeRepo.findById.mockResolvedValue(mockTree);

      const result = await service.canAccess('nonmember-1', 'tree-1', Permission.VIEW_TREE);

      expect(result).toBe(false);
    });

    it('should grant view access to non-collaborators on public tree', async () => {
      const publicTree = { ...mockTree, settings: { ...mockTree.settings, isPublic: true } };
      mockTreeRepo.findById.mockResolvedValue(publicTree);

      const result = await service.canAccess('nonmember-1', 'tree-1', Permission.VIEW_TREE);

      expect(result).toBe(true);
    });

    it('should return false for non-existent tree', async () => {
      mockTreeRepo.findById.mockResolvedValue(null);

      const result = await service.canAccess('user-1', 'nonexistent', Permission.VIEW_TREE);

      expect(result).toBe(false);
    });
  });

  describe('getPermissions', () => {
    it('should return all permissions for owner', async () => {
      mockTreeRepo.findById.mockResolvedValue(mockTree);

      const result = await service.getPermissions('owner-1', 'tree-1');

      expect(result).toContain(Permission.VIEW_TREE);
      expect(result).toContain(Permission.EDIT_TREE);
      expect(result).toContain(Permission.DELETE_TREE);
      expect(result).toContain(Permission.ADD_PERSON);
    });

    it('should return editor permissions for editor role', async () => {
      mockTreeRepo.findById.mockResolvedValue(mockTree);

      const result = await service.getPermissions('editor-1', 'tree-1');

      expect(result).toContain(Permission.VIEW_TREE);
      expect(result).toContain(Permission.EDIT_TREE);
      expect(result).toContain(Permission.ADD_PERSON);
      expect(result).not.toContain(Permission.DELETE_TREE);
    });

    it('should return viewer permissions for viewer role', async () => {
      mockTreeRepo.findById.mockResolvedValue(mockTree);

      const result = await service.getPermissions('viewer-1', 'tree-1');

      expect(result).toContain(Permission.VIEW_TREE);
      expect(result).not.toContain(Permission.EDIT_TREE);
    });
  });

  describe('getRolePermissions', () => {
    it('should return admin permissions', () => {
      const result = service.getRolePermissions('admin');

      expect(result).toContain(Permission.VIEW_TREE);
      expect(result).toContain(Permission.DELETE_TREE);
      expect(result).toContain(Permission.MANAGE_COLLABORATORS);
    });

    it('should return editor permissions', () => {
      const result = service.getRolePermissions('editor');

      expect(result).toContain(Permission.VIEW_TREE);
      expect(result).toContain(Permission.EDIT_TREE);
      expect(result).not.toContain(Permission.DELETE_TREE);
      expect(result).not.toContain(Permission.MANAGE_COLLABORATORS);
    });

    it('should return viewer permissions', () => {
      const result = service.getRolePermissions('viewer');

      expect(result).toContain(Permission.VIEW_TREE);
      expect(result).not.toContain(Permission.EDIT_TREE);
      expect(result).not.toContain(Permission.ADD_PERSON);
    });

    it('should return empty array for unknown role', () => {
      const result = service.getRolePermissions('unknown');

      expect(result).toEqual([]);
    });
  });

  describe('hasMinimumRole', () => {
    it('should return true for owner checking against any role', async () => {
      mockTreeRepo.findById.mockResolvedValue(mockTree);

      expect(await service.hasMinimumRole('owner-1', 'tree-1', 'viewer')).toBe(true);
      expect(await service.hasMinimumRole('owner-1', 'tree-1', 'editor')).toBe(true);
      expect(await service.hasMinimumRole('owner-1', 'tree-1', 'admin')).toBe(true);
    });

    it('should return true for editor checking against viewer', async () => {
      mockTreeRepo.findById.mockResolvedValue(mockTree);

      const result = await service.hasMinimumRole('editor-1', 'tree-1', 'viewer');

      expect(result).toBe(true);
    });

    it('should return false for editor checking against admin', async () => {
      mockTreeRepo.findById.mockResolvedValue(mockTree);

      const result = await service.hasMinimumRole('editor-1', 'tree-1', 'admin');

      expect(result).toBe(false);
    });

    it('should return false for non-collaborator', async () => {
      mockTreeRepo.findById.mockResolvedValue(mockTree);

      const result = await service.hasMinimumRole('nonmember-1', 'tree-1', 'viewer');

      expect(result).toBe(false);
    });
  });

  describe('getUserRole', () => {
    it('should return admin for owner', async () => {
      mockTreeRepo.findById.mockResolvedValue(mockTree);

      const result = await service.getUserRole('owner-1', 'tree-1');

      expect(result).toBe('admin');
    });

    it('should return editor role for editor collaborator', async () => {
      mockTreeRepo.findById.mockResolvedValue(mockTree);

      const result = await service.getUserRole('editor-1', 'tree-1');

      expect(result).toBe('editor');
    });

    it('should return viewer role for viewer collaborator', async () => {
      mockTreeRepo.findById.mockResolvedValue(mockTree);

      const result = await service.getUserRole('viewer-1', 'tree-1');

      expect(result).toBe('viewer');
    });
  });

  describe('isOwner', () => {
    it('should return true for owner', async () => {
      mockTreeRepo.isOwner.mockResolvedValue(true);

      const result = await service.isOwner('owner-1', 'tree-1');

      expect(result).toBe(true);
      expect(mockTreeRepo.isOwner).toHaveBeenCalledWith('tree-1', 'owner-1');
    });

    it('should return false for non-owner', async () => {
      mockTreeRepo.isOwner.mockResolvedValue(false);

      const result = await service.isOwner('editor-1', 'tree-1');

      expect(result).toBe(false);
    });
  });
});
