import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICollaborator {
  userId: mongoose.Types.ObjectId;
  permission: 'viewer' | 'editor' | 'admin';
  addedAt: Date;
}

export interface ITreeSettings {
  isPublic: boolean;
  allowComments: boolean;
  defaultPhotoQuality: 'low' | 'medium' | 'high';
  language: string;
}

export interface IFamilyTree extends Document {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  rootPersonId?: mongoose.Types.ObjectId;
  collaborators: ICollaborator[];
  settings: ITreeSettings;
  createdAt: Date;
  updatedAt: Date;
}

const CollaboratorSchema = new Schema<ICollaborator>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  permission: { type: String, enum: ['viewer', 'editor', 'admin'], required: true },
  addedAt: { type: Date, default: Date.now },
}, { _id: false });

const TreeSettingsSchema = new Schema<ITreeSettings>({
  isPublic: { type: Boolean, default: false },
  allowComments: { type: Boolean, default: true },
  defaultPhotoQuality: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  language: { type: String, default: 'en' },
}, { _id: false });

const FamilyTreeSchema = new Schema<IFamilyTree>({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  rootPersonId: { type: Schema.Types.ObjectId, ref: 'Person' },
  collaborators: [CollaboratorSchema],
  settings: { type: TreeSettingsSchema, default: () => ({}) },
}, { timestamps: true });

export const FamilyTreeModel: Model<IFamilyTree> =
  mongoose.models.FamilyTree || mongoose.model<IFamilyTree>('FamilyTree', FamilyTreeSchema);
