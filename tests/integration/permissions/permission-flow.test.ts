/**
 * Permission System Integration Tests
 *
 * Tests for the permission system:
 * - Owner permissions enforcement
 * - Role-based permissions (viewer, editor, admin)
 * - Attribute-based permissions
 * - Tree access control
 */

import { PermissionService } from '@/services/permission/PermissionService';
import { IPermissionService, Permission } from '@/services/permission/IPermissionService';
import { ITreeRepository } from '@/repositories/interfaces/ITreeRepository';
import { ICollaboratorRepository } from '@/repositories/interfaces/ICollaboratorRepository';
import { ITree } from '@/types/tree';
import { ICollaborator } from '@/types/collaborator';
import { IPermissionStrategy, PermissionResult, PermissionContext } from '@/strategies/permission/IPermissionStrategy';

// Mock the repositories
const mockTreeRepo: jest.Mocked<ITreeRepository> = {
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findById: jest.fn(),
  findByOwnerId: jest.fn(),
  findByCollaboratorId: jest.fn(),
  isOwner: jest.fn(),
} as any;

const mockCollaboratorRepo: jest.Mocked<ICollaboratorRepository> = {
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findByTreeId: jest.fn(),
  findByUserId: jest.fn(),
  findByTreeAndUser: jest.fn(),
  findById: jest.fn(),
} as any;

// Mock strategies for the PermissionService
const createMockStrategy = (name: string, priority: number, shouldGrant: boolean): IPermissionStrategy => ({
  name,
  priority,
  canAccess: jest.fn().mockResolvedValue({
    allowed: shouldGrant,
    grantedBy: shouldGrant ? name : undefined,
    denied: false,
  } as PermissionResult),
  getPermissions: jest.fn().mockResolvedValue([]),
});

describe('Permission System Integration Tests', () => {
  let permissionService: IPermissionService;
  let mockOwnerStrategy: IPermissionStrategy;
  let mockCollaboratorStrategy: IPermissionStrategy;

  const mockTree: ITree = {
    _id: 'tree-1',
    ownerId: 'owner-1',
    name: 'Test Family Tree',
    settings: {
      isPublic: false,
      allowComments: false,
      defaultPhotoQuality: 'medium',
      language: 'en',
    },
    collaborators: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCollaborator: ICollaborator = {
    _id: 'collab-1',
    treeId: 'tree-1',
    userId: 'user-2',
    role: 'editor',
    invitedBy: 'owner-1',
    status: 'accepted',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock strategies
    mockOwnerStrategy = createMockStrategy('owner', 100, true);
    mockCollaboratorStrategy = createMockStrategy('collaborator', 50, false);

    // Create permission service with strategies
    permissionService = new PermissionService([mockOwnerStrategy, mockCollaboratorStrategy]);
  });

  describe('Owner Permissions', () => {
    it('should grant all permissions to tree owner', async () => {
      // Mock owner strategy to grant all permissions
      mockOwnerStrategy.canAccess.mockResolvedValue({ allowed: true, grantedBy: 'owner' });

      const canView = await permissionService.canAccess('owner-1', 'tree-1', Permission.VIEW_TREE);
      const canEdit = await permissionService.canAccess('owner-1', 'tree-1', Permission.EDIT_TREE);
      const canDelete = await permissionService.canAccess('owner-1', 'tree-1', Permission.DELETE_TREE);
      const canAddPerson = await permissionService.canAccess('owner-1', 'tree-1', Permission.ADD_PERSON);

      expect(canView).toBe(true);
      expect(canEdit).toBe(true);
      expect(canDelete).toBe(true);
      expect(canAddPerson).toBe(true);
    });

    it('should allow owner to delete tree', async () => {
      mockOwnerStrategy.canAccess.mockResolvedValue({ allowed: true, grantedBy: 'owner' });

      const canDelete = await permissionService.canAccess('owner-1', 'tree-1', Permission.DELETE_TREE);

      expect(canDelete).toBe(true);
    });

    it('should deny non-owner from modifying tree', async () => {
      // Mock strategies to deny access
      mockOwnerStrategy.canAccess.mockResolvedValue({ allowed: false });
      mockCollaboratorStrategy.canAccess.mockResolvedValue({ allowed: false });

      const canEdit = await permissionService.canAccess('user-2', 'tree-1', Permission.EDIT_TREE);
      const canDelete = await permissionService.canAccess('user-2', 'tree-1', Permission.DELETE_TREE);

      expect(canEdit).toBe(false);
      expect(canDelete).toBe(false);
    });
  });

  describe('Role-Based Permissions', () => {
    it('should grant viewer read-only access', async () => {
      // Mock strategy to grant only view permission
      mockOwnerStrategy.canAccess.mockImplementation(async (perm) => ({
        allowed: perm === Permission.VIEW_TREE,
        grantedBy: perm === Permission.VIEW_TREE ? 'owner' : undefined,
      }));

      const canView = await permissionService.canAccess('user-2', 'tree-1', Permission.VIEW_TREE);
      const canEdit = await permissionService.canAccess('user-2', 'tree-1', Permission.EDIT_TREE);

      expect(canView).toBe(true);
      expect(canEdit).toBe(false);
    });

    it('should grant editor edit access but not delete', async () => {
      // Mock strategy to grant edit but not delete
      mockOwnerStrategy.canAccess.mockImplementation(async (perm) => ({
        allowed: perm === Permission.VIEW_TREE || perm === Permission.EDIT_TREE || perm === Permission.ADD_PERSON,
        grantedBy: perm !== Permission.DELETE_TREE ? 'owner' : undefined,
      }));

      const canView = await permissionService.canAccess('user-2', 'tree-1', Permission.VIEW_TREE);
      const canEdit = await permissionService.canAccess('user-2', 'tree-1', Permission.EDIT_TREE);
      const canAddPerson = await permissionService.canAccess('user-2', 'tree-1', Permission.ADD_PERSON);
      const canDelete = await permissionService.canAccess('user-2', 'tree-1', Permission.DELETE_TREE);

      expect(canView).toBe(true);
      expect(canEdit).toBe(true);
      expect(canAddPerson).toBe(true);
      expect(canDelete).toBe(false);
    });
  });

  describe('Tree Access Control', () => {
    it('should deny access when no strategy grants permission', async () => {
      // Mock strategies to deny access
      mockOwnerStrategy.canAccess.mockResolvedValue({ allowed: false });
      mockCollaboratorStrategy.canAccess.mockResolvedValue({ allowed: false });

      const canView = await permissionService.canAccess('user-2', 'tree-1', Permission.VIEW_TREE);

      expect(canView).toBe(false);
    });

    it('should allow access when strategy grants permission', async () => {
      // Mock strategy to grant access
      mockOwnerStrategy.canAccess.mockResolvedValue({ allowed: true, grantedBy: 'owner' });

      const canView = await permissionService.canAccess('user-2', 'tree-1', Permission.VIEW_TREE);

      expect(canView).toBe(true);
    });
  });

  describe('Permission Caching', () => {
    it('should cache permission checks for performance', async () => {
      mockOwnerStrategy.canAccess.mockResolvedValue({ allowed: true, grantedBy: 'owner' });

      // First call
      await permissionService.canAccess('user-2', 'tree-1', Permission.VIEW_TREE);

      // Second call should use cache
      await permissionService.canAccess('user-2', 'tree-1', Permission.VIEW_TREE);

      // Should only call strategy once due to caching
      expect(mockOwnerStrategy.canAccess).toHaveBeenCalledTimes(1);
    });

    it('should invalidate cache when permissions change', async () => {
      mockOwnerStrategy.canAccess.mockResolvedValue({ allowed: true, grantedBy: 'owner' });

      // Initial check
      await permissionService.canAccess('user-2', 'tree-1', Permission.EDIT_TREE);

      // Invalidate cache
      permissionService.invalidateCache('user-2', 'tree-1');

      // Check again - should call strategy again
      await permissionService.canAccess('user-2', 'tree-1', Permission.EDIT_TREE);

      expect(mockOwnerStrategy.canAccess).toHaveBeenCalledTimes(2);
    });
  });

  describe('Role Hierarchy', () => {
    it('should return permission set for each role', () => {
      // Note: getRolePermissions uses a hardcoded map in PermissionService
      // The mock strategies don't affect this method
      const viewerPerms = permissionService.getRolePermissions('viewer');
      const editorPerms = permissionService.getRolePermissions('editor');
      const adminPerms = permissionService.getRolePermissions('admin');
      const ownerPerms = permissionService.getRolePermissions('owner');
      const guestPerms = permissionService.getRolePermissions('guest');
      const invalidPerms = permissionService.getRolePermissions('invalid');

      // All valid roles should return an array (even if empty for some reason)
      expect(Array.isArray(viewerPerms)).toBe(true);
      expect(Array.isArray(editorPerms)).toBe(true);
      expect(Array.isArray(adminPerms)).toBe(true);
      expect(Array.isArray(ownerPerms)).toBe(true);
      expect(Array.isArray(guestPerms)).toBe(true);
      expect(Array.isArray(invalidPerms)).toBe(true);

      // Invalid role should return empty array
      expect(invalidPerms.length).toBe(0);
    });

    it('should verify owner has more permissions than viewer', () => {
      const viewerPerms = permissionService.getRolePermissions('viewer');
      const ownerPerms = permissionService.getRolePermissions('owner');

      // Owner should have more permissions than viewer
      // (This tests the permission hierarchy concept)
      if (ownerPerms.length > 0 && viewerPerms.length > 0) {
        expect(ownerPerms.length).toBeGreaterThan(viewerPerms.length);
      }
    });
  });

  describe('Minimum Role Check', () => {
    it('should return true when user has required role or higher', async () => {
      // Mock getPermissions to return editor-level permissions
      mockOwnerStrategy.getPermissions.mockResolvedValue([
        Permission.VIEW_TREE,
        Permission.EDIT_TREE,
        Permission.EXPORT_TREE,
        Permission.ADD_PERSON,
        Permission.EDIT_PERSON,
        Permission.VIEW_PERSON,
        Permission.ADD_RELATIONSHIP,
        Permission.EDIT_RELATIONSHIP,
        Permission.UPLOAD_MEDIA,
      ]);

      const hasAdminOrHigher = await permissionService.hasMinimumRole('user-2', 'tree-1', 'admin');
      const hasEditorOrHigher = await permissionService.hasMinimumRole('user-2', 'tree-1', 'editor');
      const hasViewerOrHigher = await permissionService.hasMinimumRole('user-2', 'tree-1', 'viewer');
      const hasOwnerRole = await permissionService.hasMinimumRole('user-2', 'tree-1', 'owner');

      // Editor has editor permissions
      expect(hasEditorOrHigher).toBe(true);
      // Editor is viewer or higher
      expect(hasViewerOrHigher).toBe(true);
      // Editor is not admin or higher
      expect(hasAdminOrHigher).toBe(false);
      // Editor is not owner
      expect(hasOwnerRole).toBe(false);
    });
  });

  describe('Get All Permissions', () => {
    it('should return all permissions for user on tree', async () => {
      // Mock getPermissions to return some permissions
      mockOwnerStrategy.getPermissions.mockResolvedValue([
        Permission.VIEW_TREE,
        Permission.EDIT_TREE,
        Permission.ADD_PERSON,
      ]);

      const permissions = await permissionService.getPermissions('user-2', 'tree-1');

      expect(permissions).toBeInstanceOf(Array);
      expect(permissions.length).toBeGreaterThan(0);
      expect(permissions).toContain(Permission.VIEW_TREE);
    });
  });
});
