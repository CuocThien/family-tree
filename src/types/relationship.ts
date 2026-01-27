export type RelationshipType = 'parent' | 'child' | 'spouse' | 'sibling';

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
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
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
