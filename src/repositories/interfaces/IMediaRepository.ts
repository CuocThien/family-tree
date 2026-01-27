import { IMedia, CreateMediaData, UpdateMediaData, MediaType } from '@/types/media';

export interface MediaQueryOptions {
  limit?: number;
  offset?: number;
  type?: MediaType;
  sortBy?: 'createdAt' | 'dateTaken' | 'filename';
  sortOrder?: 'asc' | 'desc';
}

export interface IMediaRepository {
  // CRUD Operations
  findById(id: string): Promise<IMedia | null>;
  findByTreeId(treeId: string, options?: MediaQueryOptions): Promise<IMedia[]>;
  findByPersonId(personId: string, options?: MediaQueryOptions): Promise<IMedia[]>;
  create(data: CreateMediaData): Promise<IMedia>;
  update(id: string, data: UpdateMediaData): Promise<IMedia>;
  delete(id: string): Promise<void>;

  // Storage Key Operations
  findByStorageKey(storageKey: string): Promise<IMedia | null>;

  // Bulk Operations
  deleteByPersonId(personId: string): Promise<number>;
  deleteByTreeId(treeId: string): Promise<number>;

  // Queries
  countByTreeId(treeId: string): Promise<number>;
  countByPersonId(personId: string): Promise<number>;
  getTotalSizeByTreeId(treeId: string): Promise<number>;
}
