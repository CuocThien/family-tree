export type PermissionLevel = 'viewer' | 'editor' | 'admin';
export type TreePrivacy = 'private' | 'family' | 'public';

export type PhotoQuality = 'low' | 'medium' | 'high';

export interface ICollaborator {
  userId: string;
  permission: PermissionLevel;
  addedAt: Date;
  addedBy?: string;
}

export interface ITreeSettings {
  isPublic: boolean;
  allowComments: boolean;
  defaultPhotoQuality: PhotoQuality;
  language: string;
  defaultPrivacyLevel?: TreePrivacy;
  allowDnaMatching?: boolean;
  showLivingPersonDetails?: boolean;
}

export interface TreeStats {
  memberCount: number;
  relationshipCount: number;
  mediaCount: number;
  oldestPerson?: IPerson;
  newestPerson?: IPerson;
  generations: number;
}

/**
 * Domain type for FamilyTree entity
 * Note: Uses string for IDs instead of mongoose.Types.ObjectId
 */
export interface ITree {
  _id: string;
  ownerId: string;
  name: string;
  description?: string;
  rootPersonId?: string;
  collaborators: ICollaborator[];
  settings: ITreeSettings;
  privacy?: TreePrivacy;
  coverImage?: string;
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
