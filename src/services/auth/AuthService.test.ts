import { AuthService } from './AuthService';
import { IAuthService, AuthResult } from './IAuthService';
import { IUserRepository } from '@/repositories/interfaces/IUserRepository';
import { IEmailService } from '@/services/email/IEmailService';
import { RegisterDto, LoginDto, UpdateProfileDto } from '@/types/dtos/auth';
import { IUser } from '@/types/user';
import { ValidationError, NotFoundError, BusinessRuleError } from '@/services/errors/ServiceErrors';

describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockEmailService: jest.Mocked<IEmailService>;

  const mockUser: IUser = {
    _id: 'user-1',
    email: 'test@example.com',
    role: 'user',
    isVerified: false,
    profile: {
      name: 'Test User',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockUserRepo = {
      create: jest.fn(),
      update: jest.fn(),
      updatePassword: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      verifyEmail: jest.fn(),
    } as unknown as jest.Mocked<IUserRepository>;

    mockEmailService = {
      sendVerificationEmail: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
    } as unknown as jest.Mocked<IEmailService>;

    service = new AuthService(mockUserRepo, mockEmailService);
  });

  describe('register', () => {
    const validData: RegisterDto = {
      email: 'test@example.com',
      password: 'SecurePass123',
      name: 'Test User',
    };

    it('should register user with valid data', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockUserRepo.create.mockResolvedValue(mockUser);
      mockEmailService.sendVerificationEmail.mockResolvedValue(undefined);

      const result = await service.register(validData);

      expect(result.user).toEqual(mockUser);
      expect(mockUserRepo.create).toHaveBeenCalled();
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should throw BusinessRuleError when email already exists', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(validData)).rejects.toThrow(BusinessRuleError);
    });

    it('should throw ValidationError for weak password', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      const weakPasswordData = { ...validData, password: 'weak' };

      await expect(service.register(weakPasswordData)).rejects.toThrow(ValidationError);
    });
  });

  describe('verifyEmail', () => {
    it('should throw ValidationError for invalid token', async () => {
      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(ValidationError);
    });

    it('should verify email with valid token after registration', async () => {
      // First register to get a valid token in the system
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockUserRepo.create.mockResolvedValue(mockUser);
      mockEmailService.sendVerificationEmail.mockResolvedValue(undefined);
      const registerResult = await service.register({
        email: 'test@example.com',
        password: 'SecurePass123',
        name: 'Test User',
      });

      // Now try to verify with the token that was set during registration
      mockUserRepo.findById.mockResolvedValue(mockUser);
      mockUserRepo.verifyEmail.mockResolvedValue({ ...mockUser, isVerified: true });

      // Get the token from the email service call
      const tokenArg = mockEmailService.sendVerificationEmail.mock.calls[0][1];

      const result = await service.verifyEmail(tokenArg);

      expect(result.isVerified).toBe(true);
    });
  });

  describe('login', () => {
    const validCredentials: LoginDto = {
      email: 'test@example.com',
      password: 'SecurePass123',
    };

    it('should throw ValidationError for invalid email', async () => {
      mockUserRepo.findByEmailWithPassword.mockResolvedValue(null);

      await expect(service.login(validCredentials)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid password', async () => {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('SecurePass123', 12);
      const userWithPassword = {
        ...mockUser,
        password: hashedPassword,
      };
      mockUserRepo.findByEmailWithPassword.mockResolvedValue(userWithPassword as any);

      await expect(
        service.login({ ...validCredentials, password: 'WrongPassword123' })
      ).rejects.toThrow(ValidationError);
    });

    it('should login with valid credentials', async () => {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('SecurePass123', 12);
      const userWithPassword = {
        ...mockUser,
        password: hashedPassword,
      };
      mockUserRepo.findByEmailWithPassword.mockResolvedValue(userWithPassword as any);

      const result = await service.login(validCredentials);

      expect(result.user).toBeDefined();
      expect(result.accessToken).toBeDefined();
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      await expect(service.logout('user-1')).resolves.not.toThrow();
    });
  });

  describe('changePassword', () => {
    it('should throw NotFoundError when user not found', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(
        service.changePassword('user-1', 'OldPassword123', 'NewPassword123')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for invalid old password', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser);
      const bcrypt = require('bcryptjs');
      const hashedPassword = bcrypt.hashSync('OldPassword123', 12);
      mockUserRepo.findByEmailWithPassword.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      } as any);

      await expect(
        service.changePassword('user-1', 'WrongOldPassword', 'NewPassword123')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for weak new password', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser);
      const bcrypt = require('bcryptjs');
      const hashedPassword = bcrypt.hashSync('OldPassword123', 12);
      mockUserRepo.findByEmailWithPassword.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      } as any);

      await expect(
        service.changePassword('user-1', 'OldPassword123', 'weak')
      ).rejects.toThrow(ValidationError);
    });

    it('should change password with valid old password', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser);
      const bcrypt = require('bcryptjs');
      const hashedPassword = bcrypt.hashSync('OldPassword123', 12);
      const userWithPassword = {
        ...mockUser,
        password: hashedPassword,
      };
      mockUserRepo.findByEmailWithPassword.mockResolvedValue(userWithPassword as any);
      mockUserRepo.updatePassword.mockResolvedValue(undefined);

      await expect(
        service.changePassword('user-1', 'OldPassword123', 'NewPassword123')
      ).resolves.not.toThrow();
    });
  });

  describe('requestPasswordReset', () => {
    it('should send reset email for existing user', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(mockUser);
      mockEmailService.sendPasswordResetEmail.mockResolvedValue(undefined);

      await expect(service.requestPasswordReset('test@example.com')).resolves.not.toThrow();
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('should not reveal whether email exists', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);

      await expect(service.requestPasswordReset('nonexistent@example.com')).resolves.not.toThrow();
    });
  });

  describe('resetPassword', () => {
    it('should throw ValidationError for invalid token', async () => {
      await expect(service.resetPassword('invalid-token', 'NewPassword123')).rejects.toThrow(
        ValidationError
      );
    });

    it('should throw ValidationError for weak password', async () => {
      await expect(service.resetPassword('invalid-token', 'weak')).rejects.toThrow(ValidationError);
    });

    it('should reset password with valid token after request', async () => {
      // First request a password reset to set up a token
      mockUserRepo.findByEmail.mockResolvedValue(mockUser);
      mockEmailService.sendPasswordResetEmail.mockResolvedValue(undefined);
      await service.requestPasswordReset('test@example.com');

      // Get the token from the email service call
      const resetToken = mockEmailService.sendPasswordResetEmail.mock.calls[0][1];

      // Now reset with that token
      mockUserRepo.findById.mockResolvedValue(mockUser);
      mockUserRepo.updatePassword.mockResolvedValue(undefined);

      await expect(service.resetPassword(resetToken, 'NewSecurePass123')).resolves.not.toThrow();
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser);

      const result = await service.getProfile('user-1');

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundError when user not found', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(service.getProfile('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateProfile', () => {
    const updateData: UpdateProfileDto = {
      name: 'Updated Name',
    };

    it('should update profile with valid data', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser);
      mockUserRepo.update.mockResolvedValue({ ...mockUser, profile: { name: 'Updated Name' } });

      const result = await service.updateProfile('user-1', updateData);

      expect(result.profile.name).toBe('Updated Name');
    });

    it('should throw NotFoundError when user not found', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(service.updateProfile('nonexistent', updateData)).rejects.toThrow(
        NotFoundError
      );
    });

    it('should update avatar when provided', async () => {
      const dataWithAvatar = { ...updateData, avatar: 'https://example.com/avatar.jpg' };
      mockUserRepo.findById.mockResolvedValue(mockUser);
      mockUserRepo.update.mockResolvedValue(mockUser);

      await expect(service.updateProfile('user-1', dataWithAvatar)).resolves.not.toThrow();
    });
  });

  describe('handleOAuthCallback', () => {
    it('should create new user for first-time OAuth login', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockUserRepo.create.mockResolvedValue(mockUser);

      const profile = {
        email: 'oauth@example.com',
        name: 'OAuth User',
        avatar: 'https://example.com/avatar.jpg',
      };

      const result = await service.handleOAuthCallback('google', profile);

      expect(result.user).toEqual(mockUser);
      expect(result.accessToken).toBeDefined();
    });

    it('should return existing user for returning OAuth user', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(mockUser);

      const profile = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const result = await service.handleOAuthCallback('google', profile);

      expect(result.user).toEqual(mockUser);
      expect(result.accessToken).toBeDefined();
    });

    it('should throw ValidationError when OAuth profile missing email', async () => {
      const profile = {
        name: 'No Email User',
      };

      await expect(service.handleOAuthCallback('google', profile)).rejects.toThrow(
        ValidationError
      );
    });
  });
});
