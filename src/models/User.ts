import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserProfileDocument {
  name: string;
  avatar?: string;
}

export interface IUserDocument extends Document {
  email: string;
  password: string;
  profile: IUserProfileDocument;
  trees: mongoose.Types.ObjectId[];
  role: 'user' | 'admin';
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserProfileSchema = new Schema<IUserProfileDocument>({
  name: { type: String, required: true },
  avatar: { type: String },
}, { _id: false });

const UserSchema = new Schema<IUserDocument>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  profile: { type: UserProfileSchema, required: true },
  trees: [{ type: Schema.Types.ObjectId, ref: 'FamilyTree' }],
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false },
}, { timestamps: true });

export const UserModel: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);
