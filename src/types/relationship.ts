import type { IPerson } from './person';

export type RelationshipType =
  | 'father'      // Male parent
  | 'mother'      // Female parent
  | 'parent'      // Keep for backward compatibility
  | 'child'
  | 'spouse'
  | 'sibling'
  | 'step-parent'
  | 'step-child'
  | 'adoptive-parent'
  | 'adoptive-child'
  | 'partner';

/**
 * Parent relationship types (for type guards and filtering)
 */
export const PARENT_RELATIONSHIP_TYPES: readonly RelationshipType[] = ['father', 'mother', 'parent'] as const;

/**
 * Domain type for Relationship entity
 * Note: Uses string for IDs instead of mongoose.Types.ObjectId
 */
export interface IRelationship {
  _id: string;
  treeId: string;
  fromPersonId: string;
  toPersonId: string;
  type: RelationshipType;
  startDate?: Date;
  endDate?: Date;
  status?: 'active' | 'ended' | 'unknown';
  notes?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FamilyMembers {
  parents: IPerson[];
  children: IPerson[];
  spouses: IPerson[];
  siblings: IPerson[];
}

export interface CreateRelationshipData {
  treeId: string;
  fromPersonId: string;
  toPersonId: string;
  type: RelationshipType;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
}

export interface UpdateRelationshipData {
  type?: RelationshipType;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
}

/**
 * Family Unit type for layout calculations
 * A family unit consists of a spouse pair (or single parent) and their shared children
 */
export interface FamilyUnit {
  id: string;
  spouse1: IPerson;
  spouse2: IPerson | null;  // null for single parent families
  children: IPerson[];
  generationLevel: number;
}

/**
 * Node position with generation info for tree layout
 */
export interface LayoutNode {
  id: string;
  person: IPerson;
  generation: number;
  x: number;
  y: number;
  familyUnitId?: string;
}
