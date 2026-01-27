import { IRelationship, CreateRelationshipData, UpdateRelationshipData, RelationshipType } from '@/types/relationship';

export interface IRelationshipRepository {
  // CRUD Operations
  findById(id: string): Promise<IRelationship | null>;
  findByTreeId(treeId: string): Promise<IRelationship[]>;
  create(data: CreateRelationshipData): Promise<IRelationship>;
  update(id: string, data: UpdateRelationshipData): Promise<IRelationship>;
  delete(id: string): Promise<void>;

  // Person-centric Queries
  findByPersonId(personId: string): Promise<IRelationship[]>;
  findByPersonIdAndType(personId: string, type: RelationshipType): Promise<IRelationship[]>;

  // Relationship Queries
  findBetweenPersons(fromPersonId: string, toPersonId: string): Promise<IRelationship | null>;
  findParents(personId: string): Promise<IRelationship[]>;
  findChildren(personId: string): Promise<IRelationship[]>;
  findSpouses(personId: string): Promise<IRelationship[]>;
  findSiblings(personId: string): Promise<IRelationship[]>;

  // Existence Checks
  exists(fromPersonId: string, toPersonId: string, type: RelationshipType): Promise<boolean>;

  // Bulk Operations
  deleteByPersonId(personId: string): Promise<number>;
  deleteByTreeId(treeId: string): Promise<number>;
}
