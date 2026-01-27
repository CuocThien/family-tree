import { IEmailService } from './IEmailService';

/**
 * Email Service implementation
 * In production, this would use a service like SendGrid, AWS SES, or Nodemailer
 */
export class EmailService implements IEmailService {
  private readonly baseUrl: string;

  constructor() {
    // Base URL for email links (should come from environment variables)
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${this.baseUrl}/auth/verify?token=${token}`;

    // In production, use actual email service
    // For now, log to console
    console.log('Sending verification email:', {
      to: email,
      subject: 'Verify your email address',
      verificationUrl,
    });

    // TODO: Implement actual email sending
    // Example with SendGrid:
    // await sgMail.send({
    //   to: email,
    //   from: 'noreply@familytree.com',
    //   subject: 'Verify your email address',
    //   html: `<p>Click <a href="${verificationUrl}">here</a> to verify your email.</p>`,
    // });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.baseUrl}/auth/reset-password?token=${token}`;

    console.log('Sending password reset email:', {
      to: email,
      subject: 'Reset your password',
      resetUrl,
    });

    // TODO: Implement actual email sending
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    console.log('Sending welcome email:', {
      to: email,
      subject: 'Welcome to Family Tree!',
      name,
    });

    // TODO: Implement actual email sending
  }
}
