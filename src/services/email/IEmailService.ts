/**
 * Service interface for Email operations.
 * Handles sending emails for verification, password resets, etc.
 */
export interface IEmailService {
  sendVerificationEmail(email: string, token: string): Promise<void>;
  sendPasswordResetEmail(email: string, token: string): Promise<void>;
  sendWelcomeEmail(email: string, name: string): Promise<void>;
}
