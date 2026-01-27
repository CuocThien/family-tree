export type PermissionLevel = 'viewer' | 'editor' | 'admin';

export type PhotoQuality = 'low' | 'medium' | 'high';

export interface ICollaborator {
  userId: string;
  permission: PermissionLevel;
  addedAt: Date;
}

export interface ITreeSettings {
  isPublic: boolean;
  allowComments: boolean;
  defaultPhotoQuality: PhotoQuality;
  language: string;
}

/**
 * Domain type for FamilyTree entity
 * Note: Uses string for IDs instead of mongoose.Types.ObjectId
 */
export interface ITree {
  _id: string;
  ownerId: string;
  name: string;
  rootPersonId?: string;
  collaborators: ICollaborator[];
  settings: ITreeSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTreeData {
  ownerId: string;
  name: string;
  rootPersonId?: string;
  settings?: Partial<ITreeSettings>;
}

export interface UpdateTreeData {
  name?: string;
  rootPersonId?: string;
  settings?: Partial<ITreeSettings>;
}
