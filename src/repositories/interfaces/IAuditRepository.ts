import { IAuditLog, CreateAuditLogData, AuditAction, EntityType } from '@/types/audit';

export interface AuditQueryOptions {
  limit?: number;
  offset?: number;
  action?: AuditAction;
  entityType?: EntityType;
  startDate?: Date;
  endDate?: Date;
}

export interface IAuditRepository {
  // Create Only (no update/delete for audit logs)
  create(data: CreateAuditLogData): Promise<IAuditLog>;

  // Queries
  findByTreeId(treeId: string, options?: AuditQueryOptions): Promise<IAuditLog[]>;
  findByUserId(userId: string, options?: AuditQueryOptions): Promise<IAuditLog[]>;
  findByEntityId(entityType: EntityType, entityId: string): Promise<IAuditLog[]>;

  // Counts
  countByTreeId(treeId: string, options?: AuditQueryOptions): Promise<number>;

  // Retention
  archiveOlderThan(date: Date): Promise<number>;
}
