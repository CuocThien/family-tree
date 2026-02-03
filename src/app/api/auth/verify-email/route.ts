/**
 * Email Verification API
 *
 * Handles email verification by validating the verification token
 * from the email link and marking the user as verified.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { container } from '@/lib/di';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(
      new URL('/login?error=invalid-token', request.url)
    );
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // Find user by verification token using the model
  // @ts-expect-error - Direct model access for token lookup
  const users = await container.userRepository.model?.find({
    verificationToken: tokenHash,
  });

  if (!users || users.length === 0) {
    return NextResponse.redirect(
      new URL('/login?error=invalid-token', request.url)
    );
  }

  const userDoc = users[0];
  const user = {
    _id: userDoc._id.toString(),
    verificationTokenExpiry: userDoc.verificationTokenExpiry,
  };

  if (user.verificationTokenExpiry && new Date(user.verificationTokenExpiry) < new Date()) {
    return NextResponse.redirect(
      new URL('/login?error=token-expired', request.url)
    );
  }

  // Verify user email
  // @ts-ignore - isVerified not in UpdateUserData but needed for email verification
  await container.userRepository.update(user._id, {
    isVerified: true,
    verificationToken: null,
    verificationTokenExpiry: null,
  } as Record<string, unknown>);

  return NextResponse.redirect(
    new URL('/login?verified=true', request.url)
  );
}
