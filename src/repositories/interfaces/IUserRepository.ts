import { IUser, IUserWithPassword, CreateUserData, UpdateUserData } from '@/types/user';

export interface IUserRepository {
  // CRUD Operations
  findById(id: string): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
  findByEmailWithPassword(email: string): Promise<IUserWithPassword | null>;
  create(data: CreateUserData): Promise<IUser>;
  update(id: string, data: UpdateUserData): Promise<IUser>;
  delete(id: string): Promise<void>;

  // Password Operations
  updatePassword(id: string, hashedPassword: string): Promise<void>;

  // Verification
  verifyEmail(id: string): Promise<IUser>;

  // Tree Association
  addTree(userId: string, treeId: string): Promise<void>;
  removeTree(userId: string, treeId: string): Promise<void>;

  // Queries
  exists(id: string): Promise<boolean>;
  emailExists(email: string): Promise<boolean>;
}
