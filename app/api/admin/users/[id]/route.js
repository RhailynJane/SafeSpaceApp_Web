import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { fetchMutation, fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { createErrorResponse, checkRateLimit } from '@/lib/security';
import { resolveUserRole } from '@/lib/security';

/**
 * @file This API route handles fetching, updating, and deleting a specific user.
 * It is a dynamic route where `[id]` is the Clerk ID of the user.
 * This is a protected admin-only endpoint with proper authorization and input validation.
 */

/**
 * Handles GET requests to fetch a single user by ID.
 * @param {Request} request - The incoming HTTP request.
 * @param {object} context - Route context containing params.
 * @returns {NextResponse} A JSON response with the user data or an error message.
 */
export async function GET(request, context) {
  try {
    const me = await currentUser();
    if (!me) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = await resolveUserRole(me.id, me.publicMetadata);
    if (role !== 'admin' && role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const params = await context.params;
    const targetUserId = params.id;

    // Fetch single user via Convex
    const user = await fetchQuery(api.users.getByClerkId, { 
      clerkId: me.id,
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
    const me = await currentUser();
    if (!me) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = await resolveUserRole(me.id, me.publicMetadata);
    if (role !== 'admin' && role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const params = await context.params;
    const targetUserId = params.id;
    const body = await request.json();
    const { first_name, last_name, email, role: userRole } = body;

    // Update user via Convex
    await fetchMutation(api.users.update, {
      clerkId: me.id,
      targetClerkId: targetUserId,
      firstName: first_name,
      lastName: last_name,
      email,
      roleId: userRole,
    });

    // Fetch updated user
    const updatedUser = await fetchQuery(api.users.getByClerkId, { 
      clerkId: me.id,
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

/**
 * Handles DELETE requests to delete a user by their ID.
 * Requires admin or superadmin role.
 * @param {Request} request - The incoming HTTP request.
 * @param {object} context - The route context, containing params.
 * @returns {NextResponse} A JSON response confirming the deletion or an error message.
 */
export async function DELETE(request, context) {
  try {
    // AuthN
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Rate-limit deletes per admin
    if (!checkRateLimit(`delete-user:${me.id}`, 20, 60_000)) {
      return createErrorResponse('Rate limit exceeded. Please try again later.', 429);
    }

    // Determine role to decide soft-delete vs hard-delete permissions
    const myRole = await resolveUserRole(me.id, me.publicMetadata);

    const params = await context.params;
    const { id } = params;
    const targetId = decodeURIComponent(id);
    if (!targetId || typeof targetId !== 'string') {
      return createErrorResponse('Invalid target user id', 400);
    }

    // Check if this is a Convex client ID (starts with specific pattern like 'js7978...')
    const isConvexClientId = targetId.match(/^[a-z0-9]{32}$/);
    
    if (isConvexClientId) {
      // This is a client record, handle differently
      console.log('Deleting client with Convex ID:', targetId);
      
      try {
        // For client records, use the remove mutation for soft deletion
        await fetchMutation(api.clients.remove, {
          clerkId: me.id,
          clientId: targetId
        });
        
        return NextResponse.json({ success: true, type: 'client' });
      } catch (convexErr) {
        console.error('Error deleting client:', convexErr);
        return createErrorResponse('Error deleting client record', 500, String(convexErr?.message || convexErr));
      }
    }

    // Handle Clerk user deletion
    const targetClerkId = targetId;

    // 1) Delete in Clerk first (prevents future logins)
    const res = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(targetClerkId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
    });
    if (!res.ok) {
      // If the user is already missing in Clerk, continue with Convex archival
      if (res.status !== 404) {
        let details = null;
        try { details = await res.json(); } catch {}
        const message = details?.errors?.[0]?.message || `Clerk deletion failed (status ${res.status})`;
        return createErrorResponse(message, 502, details);
      }
    }

    // 2) Soft-delete in Convex for Admins; hard-delete (soft in our mutation) pathway for SuperAdmin
    try {
      if (myRole === 'superadmin') {
        await fetchMutation(api.users.remove, { clerkId: me.id, targetClerkId });
      } else {
        await fetchMutation(api.users.archive, { clerkId: me.id, targetClerkId });
      }
    } catch (convexErr) {
      console.warn('Convex user status update failed after Clerk delete:', convexErr);
      // Surface the error so UI can reflect inconsistency if needed
      return createErrorResponse('User deleted in authentication, but app data could not be updated.', 502, String(convexErr?.message || convexErr));
    }

    return NextResponse.json({ success: true, type: 'user' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return createErrorResponse('Error deleting user', 500, error.message);
  }
}
