/**
 * Register API Route
 *
 * Handles user registration with email/password.
 * Creates a new user account and sends verification email.
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { container } from '@/lib/di';
import { CreateUserDTO } from '@/types/dto/user';
import { ValidationError, ConflictError } from '@/types/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      throw new ValidationError('Name must be at least 2 characters');
    }

    if (!email || typeof email !== 'string') {
      throw new ValidationError('Valid email is required');
    }

    const emailNormalized = email.toLowerCase().trim();

    if (!password || typeof password !== 'string' || password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }

    // Check if user already exists
    const existingUser = await container.userRepository.findByEmail(emailNormalized);
    if (existingUser) {
      throw new ConflictError('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user DTO
    const createUserDTO: CreateUserDTO = {
      email: emailNormalized,
      password: hashedPassword,
      profile: {
        name: name.trim(),
        avatar: null,
        bio: null,
      },
      isVerified: false,
      settings: {
        language: 'en',
        theme: 'light',
        timezone: 'UTC',
      },
    };

    // Create user
    const user = await container.userRepository.create(createUserDTO);

    // Send verification email
    try {
      await container.emailService.sendVerificationEmail(user.email, user.profile.name || 'User');
    } catch (emailError) {
      // Log but don't fail registration if email fails
      console.error('Failed to send verification email:', emailError);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
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
      return NextResponse.json({ error: error.message }, { status: 400 });
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
