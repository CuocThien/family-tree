/**
 * Register API Route
 *
 * Handles user registration with email/password.
 * Creates a new user account.
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { container } from '@/lib/di';
import { CreateUserData } from '@/types/user';
import { ValidationError, ConflictError } from '@/services/errors/ServiceErrors';

export async function POST(request: NextRequest) {
  try {

    const body = await request.json();
    const { name, email, password } = body;

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      throw ValidationError.fromMessage('Name must be at least 2 characters');
    }

    if (!email || typeof email !== 'string') {
      throw ValidationError.fromMessage('Valid email is required');
    }

    const emailNormalized = email.toLowerCase().trim();

    if (!password || typeof password !== 'string' || password.length < 8) {
      throw ValidationError.fromMessage('Password must be at least 8 characters');
    }

    // Check if user already exists
    const existingUser = await container.userRepository.findByEmail(emailNormalized);
    if (existingUser) {
      throw new ConflictError('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user data
    const createUserData: CreateUserData = {
      email: emailNormalized,
      password: hashedPassword,
      profile: {
        name: name.trim(),
      },
    };

    // Create user
    const user = await container.userRepository.create(createUserData);

    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful.',
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.profile.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.errors[0] }, { status: 400 });
    }

    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
