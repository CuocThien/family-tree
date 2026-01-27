import { IPerson, CreatePersonData, UpdatePersonData } from '@/types/person';

export interface PersonQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'firstName' | 'lastName' | 'birthDate' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PersonSearchCriteria {
  firstName?: string;
  lastName?: string;
  birthYear?: number;
  deathYear?: number;
  isLiving?: boolean;
}

export interface IPersonRepository {
  // CRUD Operations
  findById(id: string): Promise<IPerson | null>;
  findByTreeId(treeId: string, options?: PersonQueryOptions): Promise<IPerson[]>;
  create(data: CreatePersonData): Promise<IPerson>;
  update(id: string, data: UpdatePersonData): Promise<IPerson>;
  delete(id: string): Promise<void>;

  // Query Operations
  search(treeId: string, criteria: PersonSearchCriteria): Promise<IPerson[]>;
  countByTreeId(treeId: string): Promise<number>;
  findByIds(ids: string[]): Promise<IPerson[]>;

  // Existence Checks
  exists(id: string): Promise<boolean>;
  existsInTree(id: string, treeId: string): Promise<boolean>;
}
