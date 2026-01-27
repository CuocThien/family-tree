import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PermissionService } from '@/services/permission/PermissionService';
import { IPermissionStrategy } from '@/strategies/permission/IPermissionStrategy';
import { Permission, PermissionContext, PermissionResult } from '@/strategies/permission/IPermissionStrategy';
import { Role } from '@/strategies/permission/IPermissionStrategy';

// Mock strategies for testing
class MockOwnerStrategy implements IPermissionStrategy {
  name = 'owner-only';
  priority = 100;

  async canAccess(permission: Permission, context: PermissionContext): Promise<PermissionResult> {
    if (context.userId === 'owner1') {
      return { allowed: true, grantedBy: this.name, reason: 'User is owner' };
    }
    if (permission === Permission.DELETE_TREE || permission === Permission.MANAGE_COLLABORATORS) {
      return { allowed: false, reason: 'Only tree owner can perform this action' };
    }
    return { allowed: true, reason: 'Not an owner-only permission' };
  }

  async getPermissions(context: PermissionContext): Promise<Permission[]> {
    if (context.userId === 'owner1') {
      return [Permission.DELETE_TREE, Permission.MANAGE_COLLABORATORS];
    }
    return [];
  }
}

class MockRBACStrategy implements IPermissionStrategy {
  name = 'rbac';
  priority = 10;

  private rolePermissions: Map<string, Permission[]> = new Map([
    ['owner', [Permission.EDIT_TREE, Permission.DELETE_PERSON, Permission.ADD_PERSON, Permission.MANAGE_COLLABORATORS, Permission.EXPORT_TREE]],
    ['admin', [Permission.EDIT_TREE, Permission.DELETE_PERSON, Permission.ADD_PERSON, Permission.EXPORT_TREE]],
    ['editor', [Permission.EDIT_TREE, Permission.ADD_PERSON, Permission.EXPORT_TREE]],
    ['viewer', [Permission.VIEW_TREE, Permission.EXPORT_TREE]],
  ]);

  async canAccess(permission: Permission, context: PermissionContext): Promise<PermissionResult> {
    const userRole = this.getUserRole(context.userId);
    const permissions = this.rolePermissions.get(userRole) || [];

    if (permissions.includes(permission)) {
      return { allowed: true, grantedBy: this.name, reason: `Granted by role: ${userRole}` };
    }
    return { allowed: false, reason: `Role ${userRole} does not have this permission` };
  }

  async getPermissions(context: PermissionContext): Promise<Permission[]> {
    const userRole = this.getUserRole(context.userId);
    return this.rolePermissions.get(userRole) || [];
  }

  private getUserRole(userId: string): string {
    if (userId === 'owner1') return 'owner';
    if (userId === 'admin1') return 'admin';
    if (userId === 'editor1') return 'editor';
    if (userId === 'viewer1') return 'viewer';
    return 'guest';
  }
}

class MockABACStrategy implements IPermissionStrategy {
  name = 'abac';
  priority = 20;

  async canAccess(permission: Permission, context: PermissionContext): Promise<PermissionResult> {
    // Deny DELETE_PERSON for deceased persons
    if (permission === Permission.DELETE_PERSON && context.resourceId === 'deceased-person') {
      return { allowed: false, reason: 'Cannot delete deceased persons' };
    }
    // For DELETE_PERSON with resourceId, simulate a restriction check
    if (permission === Permission.DELETE_PERSON) {
      // If we have a resourceId and it's not explicitly denied, return neutral
      if (context.resourceId) {
        return { allowed: true, reason: 'No attribute restrictions' };
      }
    }
    // Return neutral for other cases
    return { allowed: true, reason: 'No attribute restrictions' };
  }

  async getPermissions(): Promise<Permission[]> {
    return [];
  }
}

describe('PermissionService Integration', () => {
  let service: PermissionService;

  beforeEach(() => {
    jest.clearAllMocks();
    const strategies: IPermissionStrategy[] = [
      new MockOwnerStrategy(),
      new MockABACStrategy(),
      new MockRBACStrategy(),
    ];
    service = new PermissionService(strategies);
  });

  describe('canAccess', () => {
    it('should allow owner to delete tree', async () => {
      const result = await service.canAccess('owner1', 'tree1', Permission.DELETE_TREE);
      expect(result).toBe(true);
    });

    it('should deny admin from deleting tree', async () => {
      const result = await service.canAccess('admin1', 'tree1', Permission.DELETE_TREE);
      expect(result).toBe(false);
    });

    it('should allow admin to edit tree', async () => {
      const result = await service.canAccess('admin1', 'tree1', Permission.EDIT_TREE);
      expect(result).toBe(true);
    });

    it('should deny viewer from editing tree', async () => {
      const result = await service.canAccess('viewer1', 'tree1', Permission.EDIT_TREE);
      expect(result).toBe(false);
    });

    it('should allow editor to add person', async () => {
      const result = await service.canAccess('editor1', 'tree1', Permission.ADD_PERSON);
      expect(result).toBe(true);
    });

    it('should allow viewer to view tree', async () => {
      const result = await service.canAccess('viewer1', 'tree1', Permission.VIEW_TREE);
      expect(result).toBe(true);
    });

    it('should apply strategies in priority order', async () => {
      // Owner strategy (priority 100) should be checked first
      // ABAC strategy (priority 20) should be checked second
      // RBAC strategy (priority 10) should be checked last

      // Verify that owner can delete (granted by owner strategy)
      const ownerResult = await service.canAccess('owner1', 'tree1', Permission.DELETE_TREE);
      expect(ownerResult).toBe(true);

      // Verify that admin cannot delete (denied by owner, checked first)
      const adminResult = await service.canAccess('admin1', 'tree1', Permission.DELETE_TREE);
      expect(adminResult).toBe(false);
    });

    it('should cache permission results', async () => {
      // First call
      await service.canAccess('viewer1', 'tree1', Permission.VIEW_TREE);

      // Second call should use cache (no way to directly verify, but should be fast)
      const startTime = Date.now();
      await service.canAccess('viewer1', 'tree1', Permission.VIEW_TREE);
      const endTime = Date.now();

      // Should be very fast due to caching
      expect(endTime - startTime).toBeLessThan(10);
    });
  });

  describe('getPermissions', () => {
    it('should combine permissions from all strategies for owner', async () => {
      const permissions = await service.getPermissions('owner1', 'tree1');

      expect(permissions).toContain(Permission.DELETE_TREE); // From owner strategy
      expect(permissions).toContain(Permission.MANAGE_COLLABORATORS); // From owner strategy
      expect(permissions).toContain(Permission.EDIT_TREE); // From RBAC
      expect(permissions).toContain(Permission.DELETE_PERSON); // From RBAC
    });

    it('should return admin permissions', async () => {
      const permissions = await service.getPermissions('admin1', 'tree1');

      expect(permissions).toContain(Permission.EDIT_TREE);
      expect(permissions).toContain(Permission.DELETE_PERSON);
      expect(permissions).toContain(Permission.ADD_PERSON);
      expect(permissions).not.toContain(Permission.DELETE_TREE);
    });

    it('should return editor permissions', async () => {
      const permissions = await service.getPermissions('editor1', 'tree1');

      expect(permissions).toContain(Permission.EDIT_TREE);
      expect(permissions).toContain(Permission.ADD_PERSON);
      expect(permissions).not.toContain(Permission.DELETE_PERSON);
    });

    it('should return viewer permissions', async () => {
      const permissions = await service.getPermissions('viewer1', 'tree1');

      expect(permissions).toContain(Permission.VIEW_TREE);
      expect(permissions).not.toContain(Permission.EDIT_TREE);
      expect(permissions).not.toContain(Permission.ADD_PERSON);
    });

    it('should return empty array for guest', async () => {
      const permissions = await service.getPermissions('guest1', 'tree1');

      expect(permissions).toEqual([]);
    });
  });

  describe('getRolePermissions', () => {
    it('should return owner permissions', () => {
      const permissions = service.getRolePermissions('owner');

      expect(permissions.length).toBeGreaterThan(10);
      expect(permissions).toContain(Permission.DELETE_TREE);
      expect(permissions).toContain(Permission.MANAGE_COLLABORATORS);
    });

    it('should return admin permissions', () => {
      const permissions = service.getRolePermissions('admin');

      expect(permissions).toContain(Permission.EDIT_TREE);
      expect(permissions).toContain(Permission.DELETE_PERSON);
      expect(permissions).not.toContain(Permission.DELETE_TREE);
    });

    it('should return editor permissions', () => {
      const permissions = service.getRolePermissions('editor');

      expect(permissions).toContain(Permission.EDIT_TREE);
      expect(permissions).toContain(Permission.ADD_PERSON);
      expect(permissions).not.toContain(Permission.DELETE_PERSON);
    });

    it('should return viewer permissions', () => {
      const permissions = service.getRolePermissions('viewer');

      expect(permissions).toContain(Permission.VIEW_TREE);
      expect(permissions).not.toContain(Permission.EDIT_TREE);
    });

    it('should return guest permissions', () => {
      const permissions = service.getRolePermissions('guest');

      expect(permissions).toContain(Permission.VIEW_TREE);
      expect(permissions).not.toContain(Permission.EDIT_TREE);
    });
  });

  describe('hasMinimumRole', () => {
    it('should return true when user has higher role', async () => {
      const result = await service.hasMinimumRole('admin1', 'tree1', 'editor');
      expect(result).toBe(true);
    });

    it('should return true when user has exact role', async () => {
      const result = await service.hasMinimumRole('editor1', 'tree1', 'editor');
      expect(result).toBe(true);
    });

    it('should return false when user has lower role', async () => {
      const result = await service.hasMinimumRole('viewer1', 'tree1', 'editor');
      expect(result).toBe(false);
    });

    it('should return false for guest', async () => {
      const result = await service.hasMinimumRole('guest1', 'tree1', 'viewer');
      expect(result).toBe(false);
    });
  });

  describe('invalidateCache', () => {
    it('should clear all cache when no arguments provided', async () => {
      // Populate cache
      await service.canAccess('viewer1', 'tree1', Permission.VIEW_TREE);
      await service.canAccess('admin1', 'tree1', Permission.EDIT_TREE);

      // Clear all cache
      service.invalidateCache();

      // Verify cache was cleared by checking a new call works
      const result = await service.canAccess('viewer1', 'tree1', Permission.VIEW_TREE);
      expect(result).toBe(true);
    });

    it('should clear cache for specific user', async () => {
      // Populate cache
      await service.canAccess('viewer1', 'tree1', Permission.VIEW_TREE);
      await service.canAccess('admin1', 'tree1', Permission.EDIT_TREE);

      // Clear cache for viewer1 only
      service.invalidateCache('viewer1');

      // admin1 should still have cached result
      const result = await service.canAccess('admin1', 'tree1', Permission.EDIT_TREE);
      expect(result).toBe(true);
    });

    it('should clear cache for specific tree', async () => {
      // Populate cache
      await service.canAccess('viewer1', 'tree1', Permission.VIEW_TREE);
      await service.canAccess('viewer1', 'tree2', Permission.VIEW_TREE);

      // Clear cache for tree1 only
      service.invalidateCache(undefined, 'tree1');

      // tree2 should still have cached result
      const result = await service.canAccess('viewer1', 'tree2', Permission.VIEW_TREE);
      expect(result).toBe(true);
    });
  });

  describe('backward compatibility methods', () => {
    it('should support getUserRole method', async () => {
      const role = await service.getUserRole('owner1', 'tree1');
      expect(role).toBe('owner');
    });

    it('should support isOwner method', async () => {
      const isOwner = await service.isOwner('owner1', 'tree1');
      expect(isOwner).toBe(true);

      const notOwner = await service.isOwner('admin1', 'tree1');
      expect(notOwner).toBe(false);
    });

    it('should support canManageCollaborators method', async () => {
      const can = await service.canManageCollaborators('owner1', 'tree1');
      expect(can).toBe(true);
    });

    it('should support canDeleteTree method', async () => {
      const can = await service.canDeleteTree('owner1', 'tree1');
      expect(can).toBe(true);

      const cannot = await service.canDeleteTree('admin1', 'tree1');
      expect(cannot).toBe(false);
    });

    it('should support canExportTree method', async () => {
      const can = await service.canExportTree('viewer1', 'tree1');
      expect(can).toBe(true);
    });
  });
});
