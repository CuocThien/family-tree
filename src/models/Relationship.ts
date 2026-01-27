import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRelationshipDocument extends Document {
  treeId: mongoose.Types.ObjectId;
  person1Id: mongoose.Types.ObjectId;
  person2Id: mongoose.Types.ObjectId;
  type: 'parent' | 'child' | 'spouse' | 'sibling';
  startDate?: Date;
  endDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RelationshipSchema = new Schema<IRelationshipDocument>({
  treeId: { type: Schema.Types.ObjectId, ref: 'FamilyTree', required: true },
  person1Id: { type: Schema.Types.ObjectId, ref: 'Person', required: true },
  person2Id: { type: Schema.Types.ObjectId, ref: 'Person', required: true },
  type: { type: String, enum: ['parent', 'child', 'spouse', 'sibling'], required: true },
  startDate: { type: Date },
  endDate: { type: Date },
  notes: { type: String },
}, { timestamps: true });

RelationshipSchema.index({ treeId: 1, person1Id: 1, person2Id: 1 });
RelationshipSchema.index({ treeId: 1, type: 1 });

export const RelationshipModel: Model<IRelationshipDocument> =
  mongoose.models.Relationship || mongoose.model<IRelationshipDocument>('Relationship', RelationshipSchema);
