import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMediaMetadataDocument {
  width?: number;
  height?: number;
  location?: string;
  dateTaken?: Date;
  description?: string;
}

export interface IMediaDocument extends Document {
  treeId: mongoose.Types.ObjectId;
  personId?: mongoose.Types.ObjectId;
  type: 'photo' | 'document';
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  metadata: IMediaMetadataDocument;
  createdAt: Date;
  updatedAt: Date;
}

const MediaMetadataSchema = new Schema<IMediaMetadataDocument>({
  width: { type: Number },
  height: { type: Number },
  location: { type: String },
  dateTaken: { type: Date },
  description: { type: String },
}, { _id: false });

const MediaSchema = new Schema<IMediaDocument>({
  treeId: { type: Schema.Types.ObjectId, ref: 'FamilyTree', required: true },
  personId: { type: Schema.Types.ObjectId, ref: 'Person' },
  type: { type: String, enum: ['photo', 'document'], required: true },
  filename: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  url: { type: String, required: true },
  metadata: { type: MediaMetadataSchema, default: {} },
}, { timestamps: true });

MediaSchema.index({ treeId: 1 });
MediaSchema.index({ treeId: 1, personId: 1 });

export const MediaModel: Model<IMediaDocument> =
  mongoose.models.Media || mongoose.model<IMediaDocument>('Media', MediaSchema);
