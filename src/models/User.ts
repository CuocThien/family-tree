import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserProfile {
  name: string;
  avatar?: string;
}

export interface IUser extends Document {
  email: string;
  password: string;
  profile: IUserProfile;
  trees: mongoose.Types.ObjectId[];
  role: 'user' | 'admin';
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserProfileSchema = new Schema<IUserProfile>({
  name: { type: String, required: true },
  avatar: { type: String },
}, { _id: false });

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  profile: { type: UserProfileSchema, required: true },
  trees: [{ type: Schema.Types.ObjectId, ref: 'FamilyTree' }],
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false },
}, { timestamps: true });

export const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
