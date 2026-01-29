import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserProfileDocument {
  name: string;
  avatar?: string;
}

export interface IUserDocument extends Document {
  email: string;
  password: string | null;
  profile: IUserProfileDocument;
  trees: mongoose.Types.ObjectId[];
  role: 'user' | 'admin';
  isVerified: boolean;
  oauthProviders?: string[];
  verificationToken?: string;
  verificationTokenExpiry?: Date;
  resetPasswordToken?: string;
  resetPasswordExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserProfileSchema = new Schema<IUserProfileDocument>({
  name: { type: String, required: true },
  avatar: { type: String },
}, { _id: false });

const UserSchema = new Schema<IUserDocument>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: false, select: false },
  profile: { type: UserProfileSchema, required: true },
  trees: [{ type: Schema.Types.ObjectId, ref: 'FamilyTree' }],
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  oauthProviders: [{ type: String }],
  verificationToken: { type: String, select: false },
  verificationTokenExpiry: { type: Date, select: false },
  resetPasswordToken: { type: String, select: false },
  resetPasswordExpiry: { type: Date, select: false },
}, { timestamps: true });

// Indexes for better query performance
// Note: email field already has index from unique: true
UserSchema.index({ isVerified: 1 }); // Index for filtering unverified users
UserSchema.index({ resetPasswordToken: 1, resetPasswordExpiry: 1 }); // Password reset queries
UserSchema.index({ verificationToken: 1, verificationTokenExpiry: 1 }); // Email verification queries

export const UserModel: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);
