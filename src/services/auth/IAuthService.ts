import { IUser } from '@/types/user';
import { RegisterDto, LoginDto, UpdateProfileDto } from '@/types/dtos/auth';

export interface AuthResult {
  user: IUser;
  accessToken?: string;
}

/**
 * Service interface for Authentication operations.
 * Handles registration, login, password management, and OAuth.
 */
export interface IAuthService {
  // Registration
  register(data: RegisterDto): Promise<AuthResult>;
  verifyEmail(token: string): Promise<IUser>;

  // Authentication
  login(data: LoginDto): Promise<AuthResult>;
  logout(userId: string): Promise<void>;

  // Password Management
  changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;

  // Profile Management
  getProfile(userId: string): Promise<IUser>;
  updateProfile(userId: string, data: UpdateProfileDto): Promise<IUser>;

  // OAuth
  handleOAuthCallback(provider: string, profile: unknown): Promise<AuthResult>;
}
