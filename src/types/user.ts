export type UserRole = 'user' | 'admin';

export interface IUserProfile {
  name: string;
  avatar?: string;
}

/**
 * Domain type for User entity
 * Note: Uses string for IDs instead of mongoose.Types.ObjectId
 */
export interface IUser {
  _id: string;
  email: string;
  profile: IUserProfile;
  trees: string[];
  role: UserRole;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email: string;
  password: string; // hashed password
  profile: IUserProfile;
  role?: UserRole;
}

export interface UpdateUserData {
  email?: string;
  profile?: Partial<IUserProfile>;
  role?: UserRole;
}
