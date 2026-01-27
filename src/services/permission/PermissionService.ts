import { IPermissionService } from './IPermissionService';
import { IPermissionStrategy, Permission, PermissionContext, PermissionResult, Role } from '@/strategies/permission/IPermissionStrategy';
import { NotFoundError, PermissionError } from '@/services/errors/ServiceErrors';

export class PermissionService implements IPermissionService {
  private strategies: IPermissionStrategy[] = [];
  private cache: Map<string, { result: boolean; expiry: number }> = new Map();
  private readonly CACHE_TTL = 60000; // 1 minute

  constructor(strategies: IPermissionStrategy[]) {
    // Sort by priority (highest first)
    this.strategies = strategies.sort((a, b) => b.priority - a.priority);
  }

  async canAccess(userId: string, treeId: string, permission: Permission): Promise<boolean> {
    const cacheKey = `${userId}:${treeId}:${permission}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.result;
    }

    const context: PermissionContext = { userId, treeId };

    // Check each strategy in priority order
    let finalResult: PermissionResult = { allowed: false, reason: 'No strategy granted permission' };
    let hasGrantedPermission = false;

    for (const strategy of this.strategies) {
      const result = await strategy.canAccess(permission, context);

      // If explicitly denied by high-priority strategy, stop
      if (result.denied) {
        finalResult = result;
        break;
      }

      // If granted, record it and stop
      if (result.allowed && result.grantedBy) {
        finalResult = result;
        hasGrantedPermission = true;
        break;
      }

      // If allowed but not granted (neutral response), continue checking
      // Don't update finalResult for neutral responses
    }

    // If no strategy explicitly granted permission, deny it
    if (!hasGrantedPermission) {
      finalResult = { allowed: false, reason: 'No strategy granted permission' };
    }

    // Cache result
    this.cache.set(cacheKey, {
      result: finalResult.allowed,
      expiry: Date.now() + this.CACHE_TTL,
    });

    return finalResult.allowed;
  }

  async getPermissions(userId: string, treeId: string): Promise<Permission[]> {
    const context: PermissionContext = { userId, treeId };
    const allPermissions = new Set<Permission>();

    for (const strategy of this.strategies) {
      const perms = await strategy.getPermissions(context);
      perms.forEach(p => allPermissions.add(p));
    }

    return Array.from(allPermissions);
  }

  getRolePermissions(role: string): Permission[] {
    // Delegate to RBAC strategy
    const rbacStrategy = this.strategies.find(s => s.name === 'rbac');
    if (!rbacStrategy) return [];

    // Create a temporary context to extract role permissions
    // This is a workaround since RBAC strategy doesn't expose getRolePermissions directly
    // In production, you might want to add a method to RBAC strategy for this
    const rolePermissions: Record<string, Permission[]> = {
      'owner': [
        Permission.VIEW_TREE,
        Permission.EDIT_TREE,
        Permission.DELETE_TREE,
        Permission.SHARE_TREE,
        Permission.EXPORT_TREE,
        Permission.ADD_PERSON,
        Permission.EDIT_PERSON,
        Permission.DELETE_PERSON,
        Permission.VIEW_PERSON,
        Permission.ADD_RELATIONSHIP,
        Permission.EDIT_RELATIONSHIP,
        Permission.DELETE_RELATIONSHIP,
        Permission.UPLOAD_MEDIA,
        Permission.DELETE_MEDIA,
        Permission.MANAGE_COLLABORATORS,
        Permission.INVITE_COLLABORATORS,
      ],
      'admin': [
        Permission.VIEW_TREE,
        Permission.EDIT_TREE,
        Permission.SHARE_TREE,
        Permission.EXPORT_TREE,
        Permission.ADD_PERSON,
        Permission.EDIT_PERSON,
        Permission.DELETE_PERSON,
        Permission.VIEW_PERSON,
        Permission.ADD_RELATIONSHIP,
        Permission.EDIT_RELATIONSHIP,
        Permission.DELETE_RELATIONSHIP,
        Permission.UPLOAD_MEDIA,
        Permission.DELETE_MEDIA,
        Permission.INVITE_COLLABORATORS,
      ],
      'editor': [
        Permission.VIEW_TREE,
        Permission.EDIT_TREE,
        Permission.EXPORT_TREE,
        Permission.ADD_PERSON,
        Permission.EDIT_PERSON,
        Permission.VIEW_PERSON,
        Permission.ADD_RELATIONSHIP,
        Permission.EDIT_RELATIONSHIP,
        Permission.UPLOAD_MEDIA,
      ],
      'viewer': [
        Permission.VIEW_TREE,
        Permission.VIEW_PERSON,
        Permission.EXPORT_TREE,
      ],
      'guest': [
        Permission.VIEW_TREE,
        Permission.VIEW_PERSON,
      ],
    };

    return rolePermissions[role] || [];
  }

  async hasMinimumRole(userId: string, treeId: string, role: string): Promise<boolean> {
    const roleHierarchy = ['guest', 'viewer', 'editor', 'admin', 'owner'];
    const requiredIndex = roleHierarchy.indexOf(role);

    const context: PermissionContext = { userId, treeId };
    const permissions = await this.getPermissions(userId, treeId);

    // Infer role from permissions
    if (permissions.includes(Permission.MANAGE_COLLABORATORS)) return requiredIndex <= 4;
    if (permissions.includes(Permission.INVITE_COLLABORATORS)) return requiredIndex <= 3;
    if (permissions.includes(Permission.DELETE_PERSON)) return requiredIndex <= 3;
    if (permissions.includes(Permission.ADD_PERSON)) return requiredIndex <= 2;
    if (permissions.includes(Permission.EDIT_TREE)) return requiredIndex <= 2;
    if (permissions.includes(Permission.VIEW_TREE)) return requiredIndex <= 1;

    return false;
  }

  invalidateCache(userId?: string, treeId?: string): void {
    if (!userId && !treeId) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (userId && key.startsWith(userId)) {
        this.cache.delete(key);
      } else if (treeId && key.includes(`:${treeId}:`)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get the user's role for a specific tree
   * This is a helper method for backward compatibility
   */
  async getUserRole(userId: string, treeId: string): Promise<string> {
    const permissions = await this.getPermissions(userId, treeId);

    // Infer role from permissions
    if (permissions.includes(Permission.MANAGE_COLLABORATORS)) return 'owner';
    if (permissions.includes(Permission.INVITE_COLLABORATORS)) return 'admin';
    if (permissions.includes(Permission.ADD_PERSON)) return 'editor';
    if (permissions.includes(Permission.VIEW_TREE)) return 'viewer';

    throw new PermissionError('User is not a member of this tree');
  }

  /**
   * Check if user is the owner of a tree
   * This is a helper method for backward compatibility
   */
  async isOwner(userId: string, treeId: string): Promise<boolean> {
    return this.canAccess(userId, treeId, Permission.MANAGE_COLLABORATORS);
  }

  /**
   * Check if user can manage collaborators
   * This is a helper method for backward compatibility
   */
  async canManageCollaborators(userId: string, treeId: string): Promise<boolean> {
    return this.canAccess(userId, treeId, Permission.MANAGE_COLLABORATORS);
  }

  /**
   * Check if user can delete a tree
   * This is a helper method for backward compatibility
   */
  async canDeleteTree(userId: string, treeId: string): Promise<boolean> {
    return this.canAccess(userId, treeId, Permission.DELETE_TREE);
  }

  /**
   * Check if user can export a tree
   * This is a helper method for backward compatibility
   */
  async canExportTree(userId: string, treeId: string): Promise<boolean> {
    return this.canAccess(userId, treeId, Permission.EXPORT_TREE);
  }
}
