import { Permission } from '@/strategies/permission/IPermissionStrategy';

// Re-export Permission for convenience
export { Permission };

/**
 * Service interface for Permission operations.
 * Handles authorization checks and role-based access control using strategy pattern.
 *
 * Permission Matrix:
 *
 * | Role   | VIEW | EDIT | DELETE | ADD_PERSON | MANAGE_COLLAB |
 * |--------|------|------|--------|------------|---------------|
 * | owner  | ✓    | ✓    | ✓      | ✓          | ✓             |
 * | admin  | ✓    | ✓    | ✗      | ✓          | ✓             |
 * | editor | ✓    | ✓    | ✗      | ✓          | ✗             |
 * | viewer | ✓    | ✗    | ✗      | ✗          | ✗             |
 * | guest  | ✓    | ✗    | ✗      | ✗          | ✗             |
 */
export interface IPermissionService {
  // Check Permissions
  canAccess(userId: string, treeId: string, permission: Permission): Promise<boolean>;
  getPermissions(userId: string, treeId: string): Promise<Permission[]>;

  // Role-based
  getRolePermissions(role: string): Permission[];
  hasMinimumRole(userId: string, treeId: string, role: string): Promise<boolean>;

  // Cache management
  invalidateCache(userId?: string, treeId?: string): void;
}
