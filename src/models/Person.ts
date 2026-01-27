import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPersonDocument extends Document {
  treeId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth?: Date;
  dateOfDeath?: Date;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  biography?: string;
  photos: string[];
  documents: string[];
  customAttributes: Map<string, string | number | boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const PersonSchema = new Schema<IPersonDocument>({
  treeId: { type: Schema.Types.ObjectId, ref: 'FamilyTree', required: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  middleName: { type: String, trim: true },
  dateOfBirth: { type: Date },
  dateOfDeath: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other', 'unknown'] },
  biography: { type: String },
  photos: [{ type: String }],
  documents: [{ type: String }],
  customAttributes: { type: Map, of: Schema.Types.Mixed, default: new Map() },
}, { timestamps: true });

// Index for faster tree-based queries
PersonSchema.index({ treeId: 1, lastName: 1, firstName: 1 });
PersonSchema.index({ treeId: 1, dateOfBirth: 1 });

export const PersonModel: Model<IPersonDocument> =
  mongoose.models.Person || mongoose.model<IPersonDocument>('Person', PersonSchema);
