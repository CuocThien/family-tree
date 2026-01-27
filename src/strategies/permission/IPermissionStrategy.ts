export enum Permission {
  // Tree permissions
  VIEW_TREE = 'view_tree',
  EDIT_TREE = 'edit_tree',
  DELETE_TREE = 'delete_tree',
  SHARE_TREE = 'share_tree',
  EXPORT_TREE = 'export_tree',

  // Person permissions
  ADD_PERSON = 'add_person',
  EDIT_PERSON = 'edit_person',
  DELETE_PERSON = 'delete_person',
  VIEW_PERSON = 'view_person',

  // Relationship permissions
  ADD_RELATIONSHIP = 'add_relationship',
  EDIT_RELATIONSHIP = 'edit_relationship',
  DELETE_RELATIONSHIP = 'delete_relationship',

  // Media permissions
  UPLOAD_MEDIA = 'upload_media',
  DELETE_MEDIA = 'delete_media',

  // Collaboration permissions
  MANAGE_COLLABORATORS = 'manage_collaborators',
  INVITE_COLLABORATORS = 'invite_collaborators',
}

export enum Role {
  OWNER = 'owner',
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  GUEST = 'guest',
}

export interface PermissionContext {
  userId: string;
  treeId: string;
  resourceType?: 'tree' | 'person' | 'relationship' | 'media';
  resourceId?: string;
  action?: string;
}

export interface PermissionResult {
  allowed: boolean;
  denied?: boolean; // Explicit denial (when true, stops strategy chain)
  reason?: string;
  grantedBy?: string; // Strategy name that granted permission
}

export interface IPermissionStrategy {
  name: string;
  priority: number; // Higher priority strategies are checked first

  canAccess(permission: Permission, context: PermissionContext): Promise<PermissionResult>;
  getPermissions(context: PermissionContext): Promise<Permission[]>;
}
