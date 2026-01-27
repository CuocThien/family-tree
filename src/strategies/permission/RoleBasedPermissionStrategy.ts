import { IPermissionStrategy, Permission, Role, PermissionContext, PermissionResult } from './IPermissionStrategy';
import { ITreeRepository } from '@/repositories/interfaces/ITreeRepository';

export class RoleBasedPermissionStrategy implements IPermissionStrategy {
  name = 'rbac';
  priority = 10;

  private readonly rolePermissions: Map<Role, Permission[]> = new Map([
    [Role.OWNER, [
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
    ]],
    [Role.ADMIN, [
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
    ]],
    [Role.EDITOR, [
      Permission.VIEW_TREE,
      Permission.EDIT_TREE,
      Permission.EXPORT_TREE,
      Permission.ADD_PERSON,
      Permission.EDIT_PERSON,
      Permission.VIEW_PERSON,
      Permission.ADD_RELATIONSHIP,
      Permission.EDIT_RELATIONSHIP,
      Permission.UPLOAD_MEDIA,
    ]],
    [Role.VIEWER, [
      Permission.VIEW_TREE,
      Permission.VIEW_PERSON,
      Permission.EXPORT_TREE,
    ]],
    [Role.GUEST, [
      Permission.VIEW_TREE,
      Permission.VIEW_PERSON,
    ]],
  ]);

  constructor(private readonly treeRepository: ITreeRepository) {}

  async canAccess(permission: Permission, context: PermissionContext): Promise<PermissionResult> {
    const role = await this.getUserRole(context.userId, context.treeId);

    if (!role) {
      return {
        allowed: false,
        reason: 'User has no role in this tree',
      };
    }

    const rolePerms = this.rolePermissions.get(role) || [];
    const allowed = rolePerms.includes(permission);

    return {
      allowed,
      reason: allowed
        ? `Permission granted by role: ${role}`
        : `Role ${role} does not have permission: ${permission}`,
      grantedBy: allowed ? this.name : undefined,
    };
  }

  async getPermissions(context: PermissionContext): Promise<Permission[]> {
    const role = await this.getUserRole(context.userId, context.treeId);
    if (!role) return [];
    return this.rolePermissions.get(role) || [];
  }

  private async getUserRole(userId: string, treeId: string): Promise<Role | null> {
    const tree = await this.treeRepository.findById(treeId);
    if (!tree) return null;

    // Check if owner
    if (tree.ownerId === userId) {
      return Role.OWNER;
    }

    // Check collaborators - map permission levels to roles
    const collaborator = tree.collaborators?.find(c => c.userId === userId);
    if (collaborator) {
      // Map permission level to role
      const permissionRoleMap: Record<string, Role> = {
        'admin': Role.ADMIN,
        'editor': Role.EDITOR,
        'viewer': Role.VIEWER,
      };
      return permissionRoleMap[collaborator.permission] || Role.VIEWER;
    }

    // Check if tree is public
    if (tree.settings?.isPublic) {
      return Role.GUEST;
    }

    return null;
  }
}
