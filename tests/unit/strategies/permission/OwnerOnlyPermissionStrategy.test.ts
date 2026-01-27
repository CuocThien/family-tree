import { describe, it, expect, beforeEach } from '@jest/globals';
import { OwnerOnlyPermissionStrategy } from '@/strategies/permission/OwnerOnlyPermissionStrategy';
import { Permission, PermissionContext } from '@/strategies/permission/IPermissionStrategy';
import { ITreeRepository } from '@/repositories/interfaces/ITreeRepository';
import { ITree } from '@/types/tree';

// Mock repository
const mockTreeRepository = {
  findById: jest.fn(),
} as unknown as ITreeRepository;

describe('OwnerOnlyPermissionStrategy', () => {
  let strategy: OwnerOnlyPermissionStrategy;

  const mockTree: ITree = {
    _id: 'tree1',
    ownerId: 'owner1',
    name: 'Test Tree',
    collaborators: [
      { userId: 'admin1', permission: 'admin', addedAt: new Date() },
    ],
    settings: { isPublic: false, allowComments: true, defaultPhotoQuality: 'medium', language: 'en' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new OwnerOnlyPermissionStrategy(mockTreeRepository);
  });

  describe('canAccess', () => {
    it('should allow owner to delete tree', async () => {
      (mockTreeRepository.findById as jest.Mock).mockResolvedValue(mockTree);

      const context: PermissionContext = { userId: 'owner1', treeId: 'tree1' };

      const result = await strategy.canAccess(Permission.DELETE_TREE, context);
      expect(result.allowed).toBe(true);
      expect(result.grantedBy).toBe('owner-only');
      expect(result.reason).toContain('User is tree owner');
    });

    it('should deny admin from deleting tree', async () => {
      (mockTreeRepository.findById as jest.Mock).mockResolvedValue(mockTree);

      const context: PermissionContext = { userId: 'admin1', treeId: 'tree1' };

      const result = await strategy.canAccess(Permission.DELETE_TREE, context);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Only tree owner can perform this action');
    });

    it('should allow owner to manage collaborators', async () => {
      (mockTreeRepository.findById as jest.Mock).mockResolvedValue(mockTree);

      const context: PermissionContext = { userId: 'owner1', treeId: 'tree1' };

      const result = await strategy.canAccess(Permission.MANAGE_COLLABORATORS, context);
      expect(result.allowed).toBe(true);
      expect(result.grantedBy).toBe('owner-only');
    });

    it('should deny admin from managing collaborators', async () => {
      (mockTreeRepository.findById as jest.Mock).mockResolvedValue(mockTree);

      const context: PermissionContext = { userId: 'admin1', treeId: 'tree1' };

      const result = await strategy.canAccess(Permission.MANAGE_COLLABORATORS, context);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Only tree owner');
    });

    it('should return neutral for non-owner-only permissions', async () => {
      (mockTreeRepository.findById as jest.Mock).mockResolvedValue(mockTree);

      const context: PermissionContext = { userId: 'admin1', treeId: 'tree1' };

      const result = await strategy.canAccess(Permission.VIEW_TREE, context);
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('Not an owner-only permission');
      expect(result.grantedBy).toBeUndefined();
    });

    it('should deny access when tree not found', async () => {
      (mockTreeRepository.findById as jest.Mock).mockResolvedValue(null);

      const context: PermissionContext = { userId: 'owner1', treeId: 'nonexistent' };

      const result = await strategy.canAccess(Permission.DELETE_TREE, context);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Tree not found');
    });
  });

  describe('getPermissions', () => {
    it('should return owner-only permissions for owner', async () => {
      (mockTreeRepository.findById as jest.Mock).mockResolvedValue(mockTree);

      const context: PermissionContext = { userId: 'owner1', treeId: 'tree1' };
      const permissions = await strategy.getPermissions(context);

      expect(permissions).toContain(Permission.DELETE_TREE);
      expect(permissions).toContain(Permission.MANAGE_COLLABORATORS);
      expect(permissions).not.toContain(Permission.VIEW_TREE);
      expect(permissions.length).toBe(2);
    });

    it('should return empty array for non-owner', async () => {
      (mockTreeRepository.findById as jest.Mock).mockResolvedValue(mockTree);

      const context: PermissionContext = { userId: 'admin1', treeId: 'tree1' };
      const permissions = await strategy.getPermissions(context);

      expect(permissions).toEqual([]);
    });

    it('should return empty array when tree not found', async () => {
      (mockTreeRepository.findById as jest.Mock).mockResolvedValue(null);

      const context: PermissionContext = { userId: 'owner1', treeId: 'nonexistent' };
      const permissions = await strategy.getPermissions(context);

      expect(permissions).toEqual([]);
    });
  });
});
