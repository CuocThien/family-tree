/**
 * Password Reset API
 *
 * Handles password reset requests by generating a reset token
 * and sending a reset email to the user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { container } from '@/lib/di';

const requestSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = requestSchema.parse(body);

    const user = await container.userRepository.findByEmail(email.toLowerCase());

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists, a reset email will be sent'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Update user with reset token
    await container.userRepository.update(user._id, {
      resetPasswordToken: resetTokenHash,
      resetPasswordExpiry: resetTokenExpiry,
    } as Record<string, unknown>);

    // Send reset email
    await container.emailService.sendPasswordResetEmail(email, resetToken);

    return NextResponse.json({
      message: 'If an account exists, a reset email will be sent'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
