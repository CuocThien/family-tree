import bcrypt from 'bcryptjs';
import { IAuthService, AuthResult } from './IAuthService';
import { IUserRepository } from '@/repositories/interfaces/IUserRepository';
import { IEmailService } from '@/services/email/IEmailService';
import { RegisterDto, LoginDto, UpdateProfileDto } from '@/types/dtos/auth';
import { IUser, CreateUserData } from '@/types/user';
import { ValidationError, NotFoundError, BusinessRuleError } from '@/services/errors/ServiceErrors';
import crypto from 'crypto';

// Token storage (in production, use Redis or database)
const verificationTokens = new Map<string, string>();
const passwordResetTokens = new Map<string, { userId: string; expiresAt: number }>();

export class AuthService implements IAuthService {
  private readonly BCRYPT_ROUNDS = 12;
  private readonly TOKEN_EXPIRY_HOURS = 24;
  private readonly RESET_TOKEN_EXPIRY_HOURS = 1;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly emailService: IEmailService
  ) {}

  async register(data: RegisterDto): Promise<AuthResult> {
    // 1. Check if email exists
    const existingUser = await this.userRepository.findByEmail(data.email.toLowerCase());
    if (existingUser) {
      throw new BusinessRuleError('Email already registered');
    }

    // 2. Validate password strength (already done by Zod schema, but double-check)
    const passwordErrors = this.validatePasswordStrength(data.password);
    if (passwordErrors.length > 0) {
      throw new ValidationError(passwordErrors);
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(data.password, this.BCRYPT_ROUNDS);

    // 4. Create user
    const user = await this.userRepository.create({
      email: data.email.toLowerCase().trim(),
      password: hashedPassword,
      profile: {
        name: data.name.trim(),
      },
      role: 'user',
    });

    // 5. Generate and store verification token
    const verificationToken = this.generateSecureToken();
    verificationTokens.set(verificationToken, user._id);

    // 6. Send verification email
    await this.emailService.sendVerificationEmail(user.email, verificationToken);

    return { user };
  }

  async verifyEmail(token: string): Promise<IUser> {
    const userId = verificationTokens.get(token);
    if (!userId) {
      throw new ValidationError(['Invalid or expired verification token']);
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    if (user.isVerified) {
      return user; // Already verified
    }

    const verifiedUser = await this.userRepository.verifyEmail(userId);
    verificationTokens.delete(token);

    return verifiedUser;
  }

  async login(data: LoginDto): Promise<AuthResult> {
    // 1. Find user with password
    const user = await this.userRepository.findByEmailWithPassword(data.email.toLowerCase());
    if (!user) {
      throw new ValidationError(['Invalid email or password']);
    }

    // 2. Verify password (user object from findByEmailWithPassword should have password field)
    const userWithPassword = user as IUser & { password: string };
    const isValidPassword = await bcrypt.compare(data.password, userWithPassword.password);
    if (!isValidPassword) {
      throw new ValidationError(['Invalid email or password']);
    }

    // 3. Generate access token (in production, use JWT)
    const accessToken = this.generateAccessToken(user._id);

    // 4. Return user without password
    const { password: _pwd, ...userWithoutPassword } = userWithPassword;

    return {
      user: userWithoutPassword as IUser,
      accessToken,
    };
  }

  async logout(userId: string): Promise<void> {
    // In a stateless JWT system, logout is handled client-side
    // If using refresh tokens, invalidate them here
    // For now, this is a no-op but kept for future token invalidation
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    // 1. Get user with password
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    // 2. We need the user with password to verify old password
    const userWithPassword = await this.userRepository.findByEmailWithPassword(user.email);
    if (!userWithPassword) {
      throw new NotFoundError('User', userId);
    }

    // 3. Verify old password
    const isValidPassword = await bcrypt.compare(
      oldPassword,
      (userWithPassword as IUser & { password: string }).password
    );
    if (!isValidPassword) {
      throw new ValidationError(['Invalid current password']);
    }

    // 4. Validate new password
    const passwordErrors = this.validatePasswordStrength(newPassword);
    if (passwordErrors.length > 0) {
      throw new ValidationError(passwordErrors);
    }

    // 5. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, this.BCRYPT_ROUNDS);

    // 6. Update password
    await this.userRepository.updatePassword(userId, hashedPassword);
  }

  async requestPasswordReset(email: string): Promise<void> {
    // 1. Find user
    const user = await this.userRepository.findByEmail(email.toLowerCase());
    if (!user) {
      // Don't reveal whether email exists
      return;
    }

    // 2. Generate reset token
    const resetToken = this.generateSecureToken();
    const expiresAt = Date.now() + this.RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;

    // 3. Store token
    passwordResetTokens.set(resetToken, { userId: user._id, expiresAt });

    // 4. Send reset email
    await this.emailService.sendPasswordResetEmail(user.email, resetToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // 1. Validate token
    const tokenData = passwordResetTokens.get(token);
    if (!tokenData) {
      throw new ValidationError(['Invalid or expired reset token']);
    }

    if (Date.now() > tokenData.expiresAt) {
      passwordResetTokens.delete(token);
      throw new ValidationError(['Reset token has expired']);
    }

    // 2. Get user
    const user = await this.userRepository.findById(tokenData.userId);
    if (!user) {
      throw new NotFoundError('User', tokenData.userId);
    }

    // 3. Validate new password
    const passwordErrors = this.validatePasswordStrength(newPassword);
    if (passwordErrors.length > 0) {
      throw new ValidationError(passwordErrors);
    }

    // 4. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, this.BCRYPT_ROUNDS);

    // 5. Update password
    await this.userRepository.updatePassword(user._id, hashedPassword);

    // 6. Invalidate token
    passwordResetTokens.delete(token);
  }

  async getProfile(userId: string): Promise<IUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }
    return user;
  }

  async updateProfile(userId: string, data: UpdateProfileDto): Promise<IUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    const updateData: CreateUserData = {
      email: user.email,
      password: '', // Password update handled separately
      profile: {
        name: user.profile.name,
      },
    };

    if (data.name !== undefined) {
      updateData.profile.name = data.name.trim();
    }
    if (data.avatar !== undefined) {
      updateData.profile.avatar = data.avatar;
    }

    const updatedUser = await this.userRepository.update(userId, {
      profile: updateData.profile,
    });

    return updatedUser;
  }

  async handleOAuthCallback(provider: string, profile: unknown): Promise<AuthResult> {
    // OAuth profile structure would depend on provider
    const oauthProfile = profile as {
      email?: string;
      name?: string;
      avatar?: string;
    };

    if (!oauthProfile.email) {
      throw new ValidationError(['OAuth profile missing email']);
    }

    // 1. Check if user exists
    let user = await this.userRepository.findByEmail(oauthProfile.email.toLowerCase());

    // 2. Create user if not exists
    if (!user) {
      user = await this.userRepository.create({
        email: oauthProfile.email.toLowerCase(),
        password: '', // OAuth users don't have password
        profile: {
          name: oauthProfile.name || 'OAuth User',
          avatar: oauthProfile.avatar,
        },
        role: 'user',
      });
    }

    // 3. Generate access token
    const accessToken = this.generateAccessToken(user._id);

    return { user, accessToken };
  }

  private validatePasswordStrength(password: string): string[] {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (password.length > 128) {
      errors.push('Password too long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return errors;
  }

  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private generateAccessToken(userId: string): string {
    // In production, use JWT with proper signing and expiration
    // For now, return a simple token
    return crypto.randomBytes(24).toString('hex');
  }
}
