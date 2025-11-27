import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { auth } from '@clerk/nextjs/server';

/**
 * POST /api/admin/users/[id]/reset-password
 * Resets a user's password (Admin/SuperAdmin only)
 */
export async function POST(request, context) {
  try {
    // Get the authenticated user
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the current user's info to check role
    const client = await clerkClient();
    const currentUser = await client.users.getUser(clerkId);
    const userRole = currentUser.publicMetadata?.role;

    // Only admin and superadmin can reset passwords
    if (!['admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get user ID from params
    const params = await context.params;
    const userId = params.id;

    // Parse request body
    const body = await request.json();
    const { password } = body;

    // Validate password
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Update user password in Clerk
    await client.users.updateUser(userId, {
      password: password,
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'Failed to reset password', details: error.message },
      { status: 500 }
    );
  }
}
