export type AuditAction = 'create' | 'update' | 'delete' | 'view' | 'export' | 'share';

export type EntityType = 'Person' | 'Relationship' | 'Media' | 'FamilyTree';

export interface IAuditLogChanges {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

/**
 * Domain type for AuditLog entity
 * Note: Uses string for IDs instead of mongoose.Types.ObjectId
 */
export interface IAuditLog {
  _id: string;
  treeId: string;
  userId: string;
  action: AuditAction;
  entityType: EntityType;
  entityId: string;
  changes: IAuditLogChanges[];
  timestamp: Date;
}

export interface CreateAuditLogData {
  treeId: string;
  userId: string;
  action: AuditAction;
  entityType: EntityType;
  entityId: string;
  changes?: IAuditLogChanges[];
}
