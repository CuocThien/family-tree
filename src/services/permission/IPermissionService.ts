/**
 * Permissions available for tree operations.
 * These permissions can be checked per-user, per-tree.
 */
export enum Permission {
  VIEW_TREE = 'view_tree',
  EDIT_TREE = 'edit_tree',
  DELETE_TREE = 'delete_tree',
  ADD_PERSON = 'add_person',
  EDIT_PERSON = 'edit_person',
  DELETE_PERSON = 'delete_person',
  ADD_RELATIONSHIP = 'add_relationship',
  MANAGE_COLLABORATORS = 'manage_collaborators',
  EXPORT_TREE = 'export_tree',
}

/**
 * Service interface for Permission operations.
 * Handles authorization checks and role-based access control.
 *
 * Permission Matrix:
 *
 * | Role   | VIEW | EDIT | DELETE | ADD_PERSON | MANAGE_COLLAB |
 * |--------|------|------|--------|------------|---------------|
 * | admin  | ✓    | ✓    | ✓      | ✓          | ✓             |
 * | editor | ✓    | ✓    | ✗      | ✓          | ✗             |
 * | viewer | ✓    | ✗    | ✗      | ✗          | ✗             |
 */
export interface IPermissionService {
  // Check Permissions
  canAccess(userId: string, treeId: string, permission: Permission): Promise<boolean>;
  getPermissions(userId: string, treeId: string): Promise<Permission[]>;

  // Role-based
  getRolePermissions(role: string): Permission[];
  hasMinimumRole(userId: string, treeId: string, role: string): Promise<boolean>;
}
