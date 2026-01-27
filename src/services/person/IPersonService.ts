import { IPerson } from '@/types/person';
import { CreatePersonDto, UpdatePersonDto } from '@/types/dtos/person';

export interface PersonSearchParams {
  query?: string;
  firstName?: string;
  lastName?: string;
  birthYear?: number;
  isLiving?: boolean;
  page?: number;
  limit?: number;
}

export interface PersonListResult {
  persons: IPerson[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Service interface for Person entity operations.
 * Handles business logic, validation, and coordination with repositories.
 */
export interface IPersonService {
  // CRUD Operations
  createPerson(treeId: string, userId: string, data: CreatePersonDto): Promise<IPerson>;
  updatePerson(personId: string, userId: string, data: UpdatePersonDto): Promise<IPerson>;
  deletePerson(personId: string, userId: string): Promise<void>;
  getPersonById(personId: string, userId: string): Promise<IPerson | null>;

  // List Operations
  getPersonsByTreeId(treeId: string, userId: string, params?: PersonSearchParams): Promise<PersonListResult>;

  // Validation
  validatePersonData(data: CreatePersonDto | UpdatePersonDto): Promise<string[]>;

  // Derived Data
  getFullName(person: IPerson): string;
  getAge(person: IPerson): number | null;
  getLifespan(person: IPerson): string;
}
