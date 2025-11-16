import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { fetchQuery, fetchMutation } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { resolveUserRole, createErrorResponse } from '@/lib/security';

/**
 * @file This API route handles fetching and updating a single user.
 * It is intended for admin use.
 */

/**
 * Handles GET requests to fetch a single user by ID.
 * @param {Request} request - The incoming HTTP request.
 * @param {object} context - Route context containing params.
 * @returns {NextResponse} A JSON response with the user data or an error message.
 */
export async function GET(request, context) {
  try {
    const { userId: clerkId, sessionClaims } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = await resolveUserRole(clerkId, sessionClaims);
    if (role !== 'admin' && role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const params = await context.params;
    const targetUserId = params.userId;

    // Fetch single user via Convex
    const user = await fetchQuery(api.users.getByClerkId, { 
      clerkId: clerkId,
      targetClerkId: targetUserId 
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Map Convex user to expected shape
    const userData = {
      id: user.clerkId || user._id,
      first_name: user.firstName || '',
      last_name: user.lastName || '',
      email: user.email || '',
      last_login: user.lastLogin ? new Date(user.lastLogin).toISOString() : 'N/A',
      created_at: user.createdAt ? new Date(user.createdAt).toISOString() : '',
      status: (user.status || 'active').charAt(0).toUpperCase() + (user.status || 'active').slice(1),
      role: user.roleId || '',
    };

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error fetching user:', error);
    return createErrorResponse('Error fetching user', 500, error.message);
  }
}

/**
 * Handles PATCH requests to update a single user.
 * @param {Request} request - The incoming HTTP request.
 * @param {object} context - Route context containing params.
 * @returns {NextResponse} A JSON response with the updated user or an error message.
 */
export async function PATCH(request, context) {
  try {
    const { userId: clerkId, sessionClaims } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = await resolveUserRole(clerkId, sessionClaims);
    if (role !== 'admin' && role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const params = await context.params;
    const targetUserId = params.userId;
    const body = await request.json();
    const { first_name, last_name, email, role: userRole } = body;

    // Update user via Convex
    await fetchMutation(api.users.update, {
      clerkId: clerkId,
      targetClerkId: targetUserId,
      firstName: first_name,
      lastName: last_name,
      email,
      roleId: userRole,
    });

    // Fetch updated user
    const updatedUser = await fetchQuery(api.users.getByClerkId, { 
      clerkId: clerkId,
      targetClerkId: targetUserId 
    });

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found after update' }, { status: 404 });
    }

    // Map Convex user to expected shape
    const userData = {
      id: updatedUser.clerkId || updatedUser._id,
      first_name: updatedUser.firstName || '',
      last_name: updatedUser.lastName || '',
      email: updatedUser.email || '',
      last_login: updatedUser.lastLogin ? new Date(updatedUser.lastLogin).toISOString() : 'N/A',
      created_at: updatedUser.createdAt ? new Date(updatedUser.createdAt).toISOString() : '',
      status: (updatedUser.status || 'active').charAt(0).toUpperCase() + (updatedUser.status || 'active').slice(1),
      role: updatedUser.roleId || '',
    };

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error updating user:', error);
    return createErrorResponse('Error updating user', 500, error.message);
  }
}
