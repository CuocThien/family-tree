import { IPermissionStrategy, Permission, PermissionContext, PermissionResult } from './IPermissionStrategy';
import { ITreeRepository } from '@/repositories/interfaces/ITreeRepository';

export class OwnerOnlyPermissionStrategy implements IPermissionStrategy {
  name = 'owner-only';
  priority = 100; // Highest priority - owner bypass

  private readonly ownerOnlyPermissions: Permission[] = [
    Permission.DELETE_TREE,
    Permission.MANAGE_COLLABORATORS,
  ];

  constructor(private readonly treeRepository: ITreeRepository) {}

  async canAccess(permission: Permission, context: PermissionContext): Promise<PermissionResult> {
    // Only applies to owner-only permissions
    if (!this.ownerOnlyPermissions.includes(permission)) {
      return {
        allowed: true, // Neutral - let other strategies decide
        reason: 'Not an owner-only permission',
      };
    }

    const tree = await this.treeRepository.findById(context.treeId);
    if (!tree) {
      return {
        allowed: false,
        reason: 'Tree not found',
      };
    }

    const isOwner = tree.ownerId === context.userId;

    return {
      allowed: isOwner,
      denied: !isOwner, // Explicit denial when not owner
      reason: isOwner
        ? 'User is tree owner'
        : 'Only tree owner can perform this action',
      grantedBy: isOwner ? this.name : undefined,
    };
  }

  async getPermissions(context: PermissionContext): Promise<Permission[]> {
    const tree = await this.treeRepository.findById(context.treeId);
    if (!tree || tree.ownerId !== context.userId) {
      return [];
    }
    return this.ownerOnlyPermissions;
  }
}
