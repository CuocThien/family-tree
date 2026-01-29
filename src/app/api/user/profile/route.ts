import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getContainer, SERVICES } from '@/lib/di';
import { z } from 'zod';
import { IUserRepository } from '@/repositories/interfaces/IUserRepository';

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  avatar: z.string().url().optional(),
  bio: z.string().max(500).optional(),
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

    const container = getContainer();
    const userRepository = container.resolve<IUserRepository>(SERVICES.UserRepository);

    // Get current user
    const currentUser = await userRepository.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Build update data - only include fields that were actually provided
    const updateData: Record<string, unknown> = {};
    if (validatedData.data.name !== undefined) {
      updateData.profile = { ...currentUser.profile, name: validatedData.data.name };
    }
    if (validatedData.data.avatar !== undefined) {
      updateData.profile = { ...currentUser.profile, avatar: validatedData.data.avatar };
    }
    if (validatedData.data.email !== undefined) {
      updateData.email = validatedData.data.email;
    }

    // Only update if there's something to change
    if (Object.keys(updateData).length > 0) {
      const updatedUser = await userRepository.update(session.user.id, updateData);

      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: updatedUser._id,
          email: updatedUser.email,
          name: updatedUser.profile.name,
          avatar: updatedUser.profile.avatar,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'No changes to apply',
      user: {
        id: currentUser._id,
        email: currentUser.email,
        name: currentUser.profile.name,
        avatar: currentUser.profile.avatar,
      },
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

    const container = getContainer();
    const userRepository = container.resolve<IUserRepository>(SERVICES.UserRepository);

    const user = await userRepository.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.profile.name,
        avatar: user.profile.avatar,
        isVerified: user.isVerified,
        role: user.role,
        trees: user.trees,
      },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
