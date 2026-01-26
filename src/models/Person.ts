import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICustomAttribute {
  key: string;
  value: string | number | boolean;
}

export interface IPerson extends Document {
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

const CustomAttributeSchema = new Schema<ICustomAttribute>({
  key: { type: String, required: true },
  value: { type: Schema.Types.Mixed, required: true },
}, { _id: false });

const PersonSchema = new Schema<IPerson>({
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

export const PersonModel: Model<IPerson> =
  mongoose.models.Person || mongoose.model<IPerson>('Person', PersonSchema);
