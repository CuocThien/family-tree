import { describe, it, expect, beforeEach } from '@jest/globals';
import { RoleBasedPermissionStrategy } from '@/strategies/permission/RoleBasedPermissionStrategy';
import { Permission, Role, PermissionContext } from '@/strategies/permission/IPermissionStrategy';
import { ITreeRepository } from '@/repositories/interfaces/ITreeRepository';
import { ITree } from '@/types/tree';

// Mock repository
const mockTreeRepository = {
  findById: jest.fn(),
} as unknown as ITreeRepository;

describe('RoleBasedPermissionStrategy', () => {
  let strategy: RoleBasedPermissionStrategy;
  const mockTree: ITree = {
    _id: 'tree1',
    ownerId: 'owner1',
    name: 'Test Tree',
    collaborators: [
      { userId: 'admin1', permission: 'admin', addedAt: new Date() },
      { userId: 'editor1', permission: 'editor', addedAt: new Date() },
      { userId: 'viewer1', permission: 'viewer', addedAt: new Date() },
    ],
    settings: { isPublic: false, allowComments: true, defaultPhotoQuality: 'medium', language: 'en' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new RoleBasedPermissionStrategy(mockTreeRepository);
  });

  describe('canAccess', () => {
    it('should allow owner to perform any action', async () => {
      (mockTreeRepository.findById as jest.Mock).mockResolvedValue(mockTree);

      const context: PermissionContext = { userId: 'owner1', treeId: 'tree1' };

      const result = await strategy.canAccess(Permission.DELETE_TREE, context);
      expect(result.allowed).toBe(true);
      expect(result.grantedBy).toBe('rbac');
      expect(result.reason).toContain('owner');
    });

    it('should allow admin to edit tree', async () => {
      (mockTreeRepository.findById as jest.Mock).mockResolvedValue(mockTree);

      const context: PermissionContext = { userId: 'admin1', treeId: 'tree1' };

      const result = await strategy.canAccess(Permission.EDIT_TREE, context);
      expect(result.allowed).toBe(true);
      expect(result.grantedBy).toBe('rbac');
    });

    it('should deny admin from deleting tree', async () => {
      (mockTreeRepository.findById as jest.Mock).mockResolvedValue(mockTree);

      const context: PermissionContext = { userId: 'admin1', treeId: 'tree1' };

      const result = await strategy.canAccess(Permission.DELETE_TREE, context);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('does not have permission');
    });

    it('should allow editor to add person', async () => {
      (mockTreeRepository.findById as jest.Mock).mockResolvedValue(mockTree);

      const context: PermissionContext = { userId: 'editor1', treeId: 'tree1' };

      const result = await strategy.canAccess(Permission.ADD_PERSON, context);
      expect(result.allowed).toBe(true);
      expect(result.grantedBy).toBe('rbac');
    });

    it('should deny editor from managing collaborators', async () => {
      (mockTreeRepository.findById as jest.Mock).mockResolvedValue(mockTree);

      const context: PermissionContext = { userId: 'editor1', treeId: 'tree1' };

      const result = await strategy.canAccess(Permission.MANAGE_COLLABORATORS, context);
      expect(result.allowed).toBe(false);
    });

    it('should allow viewer to view tree', async () => {
      (mockTreeRepository.findById as jest.Mock).mockResolvedValue(mockTree);

      const context: PermissionContext = { userId: 'viewer1', treeId: 'tree1' };

      const result = await strategy.canAccess(Permission.VIEW_TREE, context);
      expect(result.allowed).toBe(true);
      expect(result.grantedBy).toBe('rbac');
    });

    it('should deny viewer from editing tree', async () => {
      (mockTreeRepository.findById as jest.Mock).mockResolvedValue(mockTree);

      const context: PermissionContext = { userId: 'viewer1', treeId: 'tree1' };

      const result = await strategy.canAccess(Permission.EDIT_TREE, context);
      expect(result.allowed).toBe(false);
    });

    it('should grant guest permissions for public trees', async () => {
      const publicTree = { ...mockTree, settings: { ...mockTree.settings, isPublic: true } };
      (mockTreeRepository.findById as jest.Mock).mockResolvedValue(publicTree);

      const context: PermissionContext = { userId: 'guest1', treeId: 'tree1' };

      const result = await strategy.canAccess(Permission.VIEW_TREE, context);
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('guest');
    });

    it('should deny access for non-collaborators on private trees', async () => {
      (mockTreeRepository.findById as jest.Mock).mockResolvedValue(mockTree);

      const context: PermissionContext = { userId: 'stranger1', treeId: 'tree1' };

      const result = await strategy.canAccess(Permission.VIEW_TREE, context);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('no role');
    });

    it('should deny access when tree not found', async () => {
      (mockTreeRepository.findById as jest.Mock).mockResolvedValue(null);

      const context: PermissionContext = { userId: 'user1', treeId: 'nonexistent' };

      const result = await strategy.canAccess(Permission.VIEW_TREE, context);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('no role');
    });
  });

  describe('getPermissions', () => {
    it('should return all permissions for owner', async () => {
      (mockTreeRepository.findById as jest.Mock).mockResolvedValue(mockTree);

      const context: PermissionContext = { userId: 'owner1', treeId: 'tree1' };
      const permissions = await strategy.getPermissions(context);

      expect(permissions).toContain(Permission.DELETE_TREE);
      expect(permissions).toContain(Permission.MANAGE_COLLABORATORS);
      expect(permissions).toContain(Permission.VIEW_TREE);
      expect(permissions.length).toBeGreaterThan(10);
    });

    it('should return limited permissions for viewer', async () => {
      (mockTreeRepository.findById as jest.Mock).mockResolvedValue(mockTree);

      const context: PermissionContext = { userId: 'viewer1', treeId: 'tree1' };
      const permissions = await strategy.getPermissions(context);

      expect(permissions).toContain(Permission.VIEW_TREE);
      expect(permissions).not.toContain(Permission.EDIT_TREE);
      expect(permissions).not.toContain(Permission.ADD_PERSON);
    });

    it('should return empty array for user with no role', async () => {
      (mockTreeRepository.findById as jest.Mock).mockResolvedValue(mockTree);

      const context: PermissionContext = { userId: 'stranger1', treeId: 'tree1' };
      const permissions = await strategy.getPermissions(context);

      expect(permissions).toEqual([]);
    });
  });
});
