import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDIContainer } from '@/lib/di';
import { z } from 'zod';

const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  bio: z.string().max(500).optional(),
  preferences: z.object({
    defaultVisibility: z.enum(['private', 'public']).optional(),
    measurementUnit: z.enum(['metric', 'imperial']).optional(),
    openCollaboration: z.boolean().optional(),
  }).optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validatedData.error.flatten() },
        { status: 400 }
      );
    }

    const di = getDIContainer();
    // const userService = di.get('IUserService');

    // TODO: Implement user profile update logic
    // await userService.updateProfile(session.user.id, validatedData.data);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const di = getDIContainer();
    // const userService = di.get('IUserService');

    // TODO: Implement user profile fetch logic
    // const profile = await userService.getProfile(session.user.id);

    return NextResponse.json({
      user: session.user,
      // Add profile preferences when implemented
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
