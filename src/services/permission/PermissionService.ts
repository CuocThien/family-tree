import { IPermissionService, Permission } from './IPermissionService';
import { ITreeRepository } from '@/repositories/interfaces/ITreeRepository';
import { IUserRepository } from '@/repositories/interfaces/IUserRepository';
import { NotFoundError, PermissionError } from '@/services/errors/ServiceErrors';

/**
 * Permission matrix mapping roles to permissions
 */
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    Permission.VIEW_TREE,
    Permission.EDIT_TREE,
    Permission.DELETE_TREE,
    Permission.ADD_PERSON,
    Permission.EDIT_PERSON,
    Permission.DELETE_PERSON,
    Permission.ADD_RELATIONSHIP,
    Permission.MANAGE_COLLABORATORS,
    Permission.EXPORT_TREE,
  ],
  editor: [
    Permission.VIEW_TREE,
    Permission.EDIT_TREE,
    Permission.ADD_PERSON,
    Permission.EDIT_PERSON,
    Permission.ADD_RELATIONSHIP,
    Permission.EXPORT_TREE,
  ],
  viewer: [Permission.VIEW_TREE, Permission.EXPORT_TREE],
};

/**
 * Hierarchy of roles (higher number = more permissions)
 */
const ROLE_LEVELS: Record<string, number> = {
  admin: 3,
  editor: 2,
  viewer: 1,
};

export class PermissionService implements IPermissionService {
  constructor(
    private readonly treeRepository: ITreeRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async canAccess(userId: string, treeId: string, permission: Permission): Promise<boolean> {
    // Get the tree to check ownership and collaborators
    const tree = await this.treeRepository.findById(treeId);
    if (!tree) {
      return false;
    }

    // Owner has all permissions
    if (tree.ownerId === userId) {
      return true;
    }

    // Check if user is a collaborator
    const collaborator = tree.collaborators.find((c) => c.userId === userId);
    if (!collaborator) {
      // Not a collaborator, check if tree is public
      if (permission === Permission.VIEW_TREE && tree.settings.isPublic) {
        return true;
      }
      return false;
    }

    // Check if collaborator's role has the required permission
    const rolePermissions = this.getRolePermissions(collaborator.permission);
    return rolePermissions.includes(permission);
  }

  async getPermissions(userId: string, treeId: string): Promise<Permission[]> {
    const tree = await this.treeRepository.findById(treeId);
    if (!tree) {
      return [];
    }

    // Owner has all permissions
    if (tree.ownerId === userId) {
      return ROLE_PERMISSIONS.admin;
    }

    // Check if user is a collaborator
    const collaborator = tree.collaborators.find((c) => c.userId === userId);
    if (!collaborator) {
      // Not a collaborator, check if tree is public
      if (tree.settings.isPublic) {
        return [Permission.VIEW_TREE];
      }
      return [];
    }

    return this.getRolePermissions(collaborator.permission);
  }

  getRolePermissions(role: string): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  async hasMinimumRole(userId: string, treeId: string, role: string): Promise<boolean> {
    const tree = await this.treeRepository.findById(treeId);
    if (!tree) {
      throw new NotFoundError('FamilyTree', treeId);
    }

    // Owner has admin role
    if (tree.ownerId === userId) {
      return ROLE_LEVELS.admin >= ROLE_LEVELS[role];
    }

    // Find collaborator
    const collaborator = tree.collaborators.find((c) => c.userId === userId);
    if (!collaborator) {
      return false;
    }

    const userRoleLevel = ROLE_LEVELS[collaborator.permission] || 0;
    const requiredRoleLevel = ROLE_LEVELS[role] || 0;

    return userRoleLevel >= requiredRoleLevel;
  }

  /**
   * Get the user's role for a specific tree
   */
  async getUserRole(userId: string, treeId: string): Promise<string> {
    const tree = await this.treeRepository.findById(treeId);
    if (!tree) {
      throw new NotFoundError('FamilyTree', treeId);
    }

    // Owner is admin
    if (tree.ownerId === userId) {
      return 'admin';
    }

    // Check collaborators
    const collaborator = tree.collaborators.find((c) => c.userId === userId);
    if (!collaborator) {
      throw new PermissionError('User is not a member of this tree');
    }

    return collaborator.permission;
  }

  /**
   * Check if user is the owner of a tree
   */
  async isOwner(userId: string, treeId: string): Promise<boolean> {
    return this.treeRepository.isOwner(treeId, userId);
  }

  /**
   * Check if user can manage collaborators
   */
  async canManageCollaborators(userId: string, treeId: string): Promise<boolean> {
    return this.canAccess(userId, treeId, Permission.MANAGE_COLLABORATORS);
  }

  /**
   * Check if user can delete a tree
   */
  async canDeleteTree(userId: string, treeId: string): Promise<boolean> {
    return this.canAccess(userId, treeId, Permission.DELETE_TREE);
  }

  /**
   * Check if user can export a tree
   */
  async canExportTree(userId: string, treeId: string): Promise<boolean> {
    return this.canAccess(userId, treeId, Permission.EXPORT_TREE);
  }
}
