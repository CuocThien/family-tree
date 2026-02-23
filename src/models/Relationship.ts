import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRelationshipDocument extends Document {
  treeId: mongoose.Types.ObjectId;
  fromPersonId: mongoose.Types.ObjectId;
  toPersonId: mongoose.Types.ObjectId;
  type: 'father' | 'mother' | 'parent' | 'child' | 'spouse' | 'sibling' |
        'step-parent' | 'step-child' | 'adoptive-parent' | 'adoptive-child' | 'partner';
  startDate?: Date;
  endDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RelationshipSchema = new Schema<IRelationshipDocument>({
  treeId: { type: Schema.Types.ObjectId, ref: 'FamilyTree', required: true },
  fromPersonId: { type: Schema.Types.ObjectId, ref: 'Person', required: true },
  toPersonId: { type: Schema.Types.ObjectId, ref: 'Person', required: true },
  type: {
    type: String,
    enum: [
      'father',
      'mother',
      'parent',
      'child',
      'spouse',
      'sibling',
      'step-parent',
      'step-child',
      'adoptive-parent',
      'adoptive-child',
      'partner'
    ],
    required: true
  },
  startDate: { type: Date },
  endDate: { type: Date },
  notes: { type: String },
}, { timestamps: true });

RelationshipSchema.index({ treeId: 1, fromPersonId: 1, toPersonId: 1 });
RelationshipSchema.index({ treeId: 1, type: 1 });
// Individual person indexes for findByPersonId queries
RelationshipSchema.index({ fromPersonId: 1 });
RelationshipSchema.index({ toPersonId: 1 });

export const RelationshipModel: Model<IRelationshipDocument> =
  mongoose.models.Relationship || mongoose.model<IRelationshipDocument>('Relationship', RelationshipSchema);
