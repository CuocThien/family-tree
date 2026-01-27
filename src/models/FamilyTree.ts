import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICollaboratorDocument {
  userId: mongoose.Types.ObjectId;
  permission: 'viewer' | 'editor' | 'admin';
  addedAt: Date;
}

export interface ITreeSettingsDocument {
  isPublic: boolean;
  allowComments: boolean;
  defaultPhotoQuality: 'low' | 'medium' | 'high';
  language: string;
}

export interface IFamilyTreeDocument extends Document {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  rootPersonId?: mongoose.Types.ObjectId;
  collaborators: ICollaboratorDocument[];
  settings: ITreeSettingsDocument;
  createdAt: Date;
  updatedAt: Date;
}

const CollaboratorSchema = new Schema<ICollaboratorDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  permission: { type: String, enum: ['viewer', 'editor', 'admin'], required: true },
  addedAt: { type: Date, default: Date.now },
}, { _id: false });

const TreeSettingsSchema = new Schema<ITreeSettingsDocument>({
  isPublic: { type: Boolean, default: false },
  allowComments: { type: Boolean, default: true },
  defaultPhotoQuality: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  language: { type: String, default: 'en' },
}, { _id: false });

const FamilyTreeSchema = new Schema<IFamilyTreeDocument>({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  rootPersonId: { type: Schema.Types.ObjectId, ref: 'Person' },
  collaborators: [CollaboratorSchema],
  settings: { type: TreeSettingsSchema, default: () => ({}) },
}, { timestamps: true });

// Index for faster owner-based queries
FamilyTreeSchema.index({ ownerId: 1 });
FamilyTreeSchema.index({ 'collaborators.userId': 1 });

export const FamilyTreeModel: Model<IFamilyTreeDocument> =
  mongoose.models.FamilyTree || mongoose.model<IFamilyTreeDocument>('FamilyTree', FamilyTreeSchema);
