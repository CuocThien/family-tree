import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLogChangesDocument {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface IAuditLogDocument extends Document {
  treeId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action: 'create' | 'update' | 'delete' | 'view' | 'export' | 'share';
  entityType: 'Person' | 'Relationship' | 'Media' | 'FamilyTree';
  entityId: mongoose.Types.ObjectId;
  changes: IAuditLogChangesDocument[];
  timestamp: Date;
}

const AuditLogChangesSchema = new Schema<IAuditLogChangesDocument>({
  field: { type: String, required: true },
  oldValue: { type: Schema.Types.Mixed },
  newValue: { type: Schema.Types.Mixed },
}, { _id: false });

const AuditLogSchema = new Schema<IAuditLogDocument>({
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

export const AuditLogModel: Model<IAuditLogDocument> =
  mongoose.models.AuditLog || mongoose.model<IAuditLogDocument>('AuditLog', AuditLogSchema);
