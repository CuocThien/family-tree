import { ITree, CreateTreeData, UpdateTreeData, ICollaborator } from '@/types/tree';

export interface TreeQueryOptions {
  includeCollaborators?: boolean;
  includeMemberCount?: boolean;
}

export interface ITreeRepository {
  // CRUD Operations
  findById(id: string, options?: TreeQueryOptions): Promise<ITree | null>;
  findByOwnerId(ownerId: string): Promise<ITree[]>;
  findByCollaboratorId(userId: string): Promise<ITree[]>;
  create(data: CreateTreeData): Promise<ITree>;
  update(id: string, data: UpdateTreeData): Promise<ITree>;
  delete(id: string): Promise<void>;

  // Collaborator Management
  addCollaborator(treeId: string, collaborator: ICollaborator): Promise<ITree>;
  removeCollaborator(treeId: string, userId: string): Promise<ITree>;
  updateCollaboratorRole(treeId: string, userId: string, role: string): Promise<ITree>;
  getCollaborators(treeId: string): Promise<ICollaborator[]>;

  // Queries
  countByOwnerId(ownerId: string): Promise<number>;
  exists(id: string): Promise<boolean>;
  isOwner(treeId: string, userId: string): Promise<boolean>;
  hasAccess(treeId: string, userId: string): Promise<boolean>;
}
