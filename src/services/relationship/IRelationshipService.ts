import { IRelationship, RelationshipType, FamilyUnit } from '@/types/relationship';
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

  // NEW: Create bidirectional spouse relationship
  // Creates relationships in both directions (A->B and B->A)
  // Validates that a person can only have one active spouse (no end date)
  createSpouseRelationship(
    treeId: string,
    userId: string,
    personAId: string,
    personBId: string,
    data?: { startDate?: Date; endDate?: Date; notes?: string }
  ): Promise<{ relationshipA: IRelationship; relationshipB: IRelationship }>;

  // NEW: Create parent relationship with correct type based on gender
  // Automatically determines 'father', 'mother', or 'parent' based on parent's gender
  createParentRelationship(
    treeId: string,
    userId: string,
    parentId: string,
    childId: string
  ): Promise<IRelationship>;

  // NEW: Get family units for a tree
  // Returns all family units (spouse pairs + their children) for layout calculations
  getFamilyUnits(treeId: string, userId: string): Promise<FamilyUnit[]>;

  // NEW: Delete bidirectional relationship
  // Removes both directions of a bidirectional relationship (e.g., spouse)
  deleteBidirectionalRelationship(
    relationshipId: string,
    userId: string
  ): Promise<void>;

  // NEW: Update parent relationship types when gender changes
  // Called when a person's gender is updated to convert father/mother relationships
  updateParentRelationshipsOnGenderChange(
    personId: string,
    newGender: string,
    userId: string
  ): Promise<void>;
}
