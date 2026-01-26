import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLogChanges {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface IAuditLog extends Document {
  treeId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action: 'create' | 'update' | 'delete' | 'view' | 'export' | 'share';
  entityType: 'Person' | 'Relationship' | 'Media' | 'FamilyTree';
  entityId: mongoose.Types.ObjectId;
  changes: IAuditLogChanges[];
  timestamp: Date;
}

const AuditLogChangesSchema = new Schema<IAuditLogChanges>({
  field: { type: String, required: true },
  oldValue: { type: Schema.Types.Mixed },
  newValue: { type: Schema.Types.Mixed },
}, { _id: false });

const AuditLogSchema = new Schema<IAuditLog>({
  treeId: { type: Schema.Types.ObjectId, ref: 'FamilyTree', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, enum: ['create', 'update', 'delete', 'view', 'export', 'share'], required: true },
  entityType: { type: String, enum: ['Person', 'Relationship', 'Media', 'FamilyTree'], required: true },
  entityId: { type: Schema.Types.ObjectId, required: true },
  changes: [AuditLogChangesSchema],
  timestamp: { type: Date, default: Date.now },
});

AuditLogSchema.index({ treeId: 1, timestamp: -1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });

export const AuditLogModel: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
