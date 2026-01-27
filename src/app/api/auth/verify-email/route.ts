/**
 * Email Verification API
 *
 * Handles email verification by validating the verification token
 * from the email link and marking the user as verified.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getContainer } from '@/lib/di';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(
      new URL('/login?error=invalid-token', request.url)
    );
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const container = getContainer();
  const userRepository = container.userRepository;

  if (!userRepository) {
    return NextResponse.redirect(
      new URL('/login?error=server-error', request.url)
    );
  }

  // Find user by verification token
  const users = await (userRepository as any).model?.find({
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
  await (userRepository as any).update(user._id, {
    isVerified: true,
    verificationToken: null,
    verificationTokenExpiry: null,
  });

  return NextResponse.redirect(
    new URL('/login?verified=true', request.url)
  );
}
