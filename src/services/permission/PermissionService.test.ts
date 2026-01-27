import { PermissionService } from './PermissionService';
import { IPermissionService } from './IPermissionService';
import { Permission } from '@/strategies/permission/IPermissionStrategy';
import { ITreeRepository } from '@/repositories/interfaces/ITreeRepository';
import { IPersonRepository } from '@/repositories/interfaces/IPersonRepository';
import { IRelationshipRepository } from '@/repositories/interfaces/IRelationshipRepository';
import { ITree } from '@/types/tree';
import { IPerson } from '@/types/person';
import { IRelationship } from '@/types/relationship';
import { RoleBasedPermissionStrategy } from '@/strategies/permission/RoleBasedPermissionStrategy';
import { AttributeBasedPermissionStrategy } from '@/strategies/permission/AttributeBasedPermissionStrategy';
import { OwnerOnlyPermissionStrategy } from '@/strategies/permission/OwnerOnlyPermissionStrategy';

describe('PermissionService', () => {
  let service: PermissionService;
  let mockTreeRepo: jest.Mocked<ITreeRepository>;
  let mockPersonRepo: jest.Mocked<IPersonRepository>;
  let mockRelationshipRepo: jest.Mocked<IRelationshipRepository>;

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

  const publicTree: ITree = {
    ...mockTree,
    settings: {
      isPublic: true,
      allowComments: false,
      defaultPhotoQuality: 'medium',
      language: 'en',
    },
  };

  const mockPerson: IPerson = {
    _id: 'person-1',
    treeId: 'tree-1',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: new Date('1990-01-01'),
    dateOfDeath: undefined,
    photos: [],
    documents: [],
    customAttributes: new Map(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockTreeRepo = {
      findById: jest.fn(),
      isOwner: jest.fn(),
      hasAccess: jest.fn(),
    } as unknown as jest.Mocked<ITreeRepository>;

    mockPersonRepo = {
      findById: jest.fn(),
      findByTreeId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      search: jest.fn(),
      countByTreeId: jest.fn(),
      findByIds: jest.fn(),
      exists: jest.fn(),
      existsInTree: jest.fn(),
      deleteByTreeId: jest.fn(),
    } as unknown as jest.Mocked<IPersonRepository>;

    mockRelationshipRepo = {
      findById: jest.fn(),
      findByTreeId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByPersonId: jest.fn(),
      findByPersonIdAndType: jest.fn(),
      findBetweenPersons: jest.fn(),
      findParents: jest.fn(),
      findChildren: jest.fn(),
      findSpouses: jest.fn(),
      findSiblings: jest.fn(),
      exists: jest.fn(),
      deleteByPersonId: jest.fn(),
      deleteByTreeId: jest.fn(),
    } as unknown as jest.Mocked<IRelationshipRepository>;

    // Create strategies with mock repositories
    const strategies = [
      new OwnerOnlyPermissionStrategy(mockTreeRepo),
      new AttributeBasedPermissionStrategy(mockPersonRepo, mockRelationshipRepo, mockTreeRepo),
      new RoleBasedPermissionStrategy(mockTreeRepo),
    ];

    service = new PermissionService(strategies);
  });

  describe('canAccess', () => {
    it('should grant all permissions to owner', async () => {
      mockTreeRepo.findById.mockResolvedValue(mockTree);

      const result = await service.canAccess('owner-1', 'tree-1', Permission.DELETE_TREE);
      expect(result).toBe(true);
      expect(mockTreeRepo.findById).toHaveBeenCalledWith('tree-1');
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

      const result = await service.canAccess('stranger-1', 'tree-1', Permission.VIEW_TREE);
      expect(result).toBe(false);
    });

    it('should grant view access to non-collaborators on public tree', async () => {
      mockTreeRepo.findById.mockResolvedValue(publicTree);

      const result = await service.canAccess('stranger-1', 'tree-1', Permission.VIEW_TREE);
      expect(result).toBe(true);
    });

    it('should return false for non-existent tree', async () => {
      mockTreeRepo.findById.mockResolvedValue(null);

      const result = await service.canAccess('owner-1', 'nonexistent', Permission.VIEW_TREE);
      expect(result).toBe(false);
    });

    it('should cache permission results', async () => {
      mockTreeRepo.findById.mockResolvedValue(mockTree);

      // First call - should hit repository (multiple strategies may query)
      await service.canAccess('viewer-1', 'tree-1', Permission.VIEW_TREE);
      const firstCallCount = (mockTreeRepo.findById as jest.Mock).mock.calls.length;

      // Second call - should use cache (no additional repository calls)
      await service.canAccess('viewer-1', 'tree-1', Permission.VIEW_TREE);
      const secondCallCount = (mockTreeRepo.findById as jest.Mock).mock.calls.length;

      // The count should be the same, indicating cache was used
      expect(secondCallCount).toBe(firstCallCount);
    });
  });

  describe('getPermissions', () => {
    it('should return all permissions for owner', async () => {
      mockTreeRepo.findById.mockResolvedValue(mockTree);

      const permissions = await service.getPermissions('owner-1', 'tree-1');

      expect(permissions).toContain(Permission.DELETE_TREE);
      expect(permissions).toContain(Permission.EDIT_TREE);
      expect(permissions).toContain(Permission.VIEW_TREE);
      expect(permissions.length).toBeGreaterThan(5);
    });

    it('should return editor permissions for editor role', async () => {
      mockTreeRepo.findById.mockResolvedValue(mockTree);

      const permissions = await service.getPermissions('editor-1', 'tree-1');

      expect(permissions).toContain(Permission.EDIT_TREE);
      expect(permissions).toContain(Permission.VIEW_TREE);
      expect(permissions).not.toContain(Permission.DELETE_TREE);
    });

    it('should return viewer permissions for viewer role', async () => {
      mockTreeRepo.findById.mockResolvedValue(mockTree);

      const permissions = await service.getPermissions('viewer-1', 'tree-1');

      expect(permissions).toContain(Permission.VIEW_TREE);
      expect(permissions).not.toContain(Permission.EDIT_TREE);
    });
  });

  describe('getRolePermissions', () => {
    it('should return permissions for a given role', () => {
      const permissions = service.getRolePermissions('editor');

      expect(permissions).toContain(Permission.EDIT_TREE);
      expect(permissions).not.toContain(Permission.DELETE_TREE);
    });
  });

  describe('hasMinimumRole', () => {
    it('should return true when user has higher role', async () => {
      mockTreeRepo.findById.mockResolvedValue(mockTree);

      const result = await service.hasMinimumRole('editor-1', 'tree-1', 'viewer');
      expect(result).toBe(true);
    });

    it('should return false when user has lower role', async () => {
      mockTreeRepo.findById.mockResolvedValue(mockTree);

      const result = await service.hasMinimumRole('viewer-1', 'tree-1', 'editor');
      expect(result).toBe(false);
    });
  });

  describe('invalidateCache', () => {
    it('should clear all cache when no arguments provided', async () => {
      mockTreeRepo.findById.mockResolvedValue(mockTree);

      // Populate cache
      await service.canAccess('viewer-1', 'tree-1', Permission.VIEW_TREE);
      const firstCallCount = (mockTreeRepo.findById as jest.Mock).mock.calls.length;

      // Clear cache
      service.invalidateCache();

      // Next call should hit repository again
      await service.canAccess('viewer-1', 'tree-1', Permission.VIEW_TREE);
      const secondCallCount = (mockTreeRepo.findById as jest.Mock).mock.calls.length;

      // Should have more calls after cache invalidation
      expect(secondCallCount).toBeGreaterThan(firstCallCount);
    });

    it('should clear cache for specific user', async () => {
      mockTreeRepo.findById.mockResolvedValue(mockTree);

      // Populate cache
      await service.canAccess('viewer-1', 'tree-1', Permission.VIEW_TREE);
      await service.canAccess('editor-1', 'tree-1', Permission.VIEW_TREE);
      const beforeClearCount = (mockTreeRepo.findById as jest.Mock).mock.calls.length;

      // Clear cache for viewer-1 only
      service.invalidateCache('viewer-1');

      // viewer-1 should hit repository again
      await service.canAccess('viewer-1', 'tree-1', Permission.VIEW_TREE);
      const afterViewerCount = (mockTreeRepo.findById as jest.Mock).mock.calls.length;

      // editor-1 should still use cache
      await service.canAccess('editor-1', 'tree-1', Permission.VIEW_TREE);
      const afterEditorCount = (mockTreeRepo.findById as jest.Mock).mock.calls.length;

      // viewer-1 call should add new repository calls
      expect(afterViewerCount).toBeGreaterThan(beforeClearCount);
      // editor-1 call should not add new repository calls (cached)
      expect(afterEditorCount).toBe(afterViewerCount);
    });
  });

  describe('backward compatibility methods', () => {
    it('should support getUserRole method', async () => {
      mockTreeRepo.findById.mockResolvedValue(mockTree);

      const role = await service.getUserRole('owner-1', 'tree-1');
      expect(role).toBe('owner');
    });

    it('should support isOwner method', async () => {
      mockTreeRepo.findById.mockResolvedValue(mockTree);

      const isOwner = await service.isOwner('owner-1', 'tree-1');
      expect(isOwner).toBe(true);
    });

    it('should support canManageCollaborators method', async () => {
      mockTreeRepo.findById.mockResolvedValue(mockTree);

      const can = await service.canManageCollaborators('owner-1', 'tree-1');
      expect(can).toBe(true);
    });

    it('should support canDeleteTree method', async () => {
      mockTreeRepo.findById.mockResolvedValue(mockTree);

      const can = await service.canDeleteTree('owner-1', 'tree-1');
      expect(can).toBe(true);
    });

    it('should support canExportTree method', async () => {
      mockTreeRepo.findById.mockResolvedValue(mockTree);

      const can = await service.canExportTree('viewer-1', 'tree-1');
      expect(can).toBe(true);
    });
  });
});
