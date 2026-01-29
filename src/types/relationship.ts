import type { IPerson } from './person';

export type RelationshipType =
  | 'parent'
  | 'child'
  | 'spouse'
  | 'sibling'
  | 'step-parent'
  | 'step-child'
  | 'adoptive-parent'
  | 'adoptive-child'
  | 'partner';

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
