import { IRelationship, RelationshipType } from '@/types/relationship';
import { CreateRelationshipDto, UpdateRelationshipDto } from '@/types/dtos/relationship';
import { IPerson } from '@/types/person';

export interface FamilyMembers {
  parents: IPerson[];
  children: IPerson[];
  spouses: IPerson[];
  siblings: IPerson[];
}

export interface AncestryPath {
  generations: IPerson[][];
  depth: number;
}

/**
 * Service interface for Relationship entity operations.
 * Handles family queries, validation, and relationship suggestions.
 */
export interface IRelationshipService {
  // CRUD Operations
  createRelationship(treeId: string, userId: string, data: CreateRelationshipDto): Promise<IRelationship>;
  updateRelationship(relationshipId: string, userId: string, data: UpdateRelationshipDto): Promise<IRelationship>;
  deleteRelationship(relationshipId: string, userId: string): Promise<void>;

  // Batch Operations
  createRelationshipsForPerson(
    treeId: string,
    userId: string,
    personId: string,
    relationships: Array<{ relatedPersonId: string; relationshipType: RelationshipType }>
  ): Promise<IRelationship[]>;

  // Family Queries
  getFamilyMembers(personId: string, userId: string): Promise<FamilyMembers>;
  getAncestors(personId: string, userId: string, generations?: number): Promise<AncestryPath>;
  getDescendants(personId: string, userId: string, generations?: number): Promise<AncestryPath>;

  // Validation
  validateRelationship(data: CreateRelationshipDto): Promise<string[]>;
  checkForCycles(fromPersonId: string, toPersonId: string, type: RelationshipType): Promise<boolean>;

  // Suggestions
  suggestRelationships(personId: string, userId: string): Promise<IPerson[]>;
}
