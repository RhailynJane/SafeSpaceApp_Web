import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { fetchMutation } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { createErrorResponse, checkRateLimit } from '@/lib/security';

/**
 * @file This API route handles deleting a specific user from the database.
 * It is a dynamic route where `[id]` is the ID of the user to be deleted.
 * This is a protected admin-only endpoint with proper authorization and input validation.
 */

/**
 * Handles DELETE requests to delete a user by their ID.
 * Requires admin or superadmin role.
 * @param {Request} request - The incoming HTTP request.
 * @param {object} { params } - The route parameters, containing the user ID.
 * @returns {NextResponse} A JSON response confirming the deletion or an error message.
 */
export async function DELETE(request, { params }) {
  try {
    // AuthN
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Rate-limit deletes per admin
    if (!checkRateLimit(`delete-user:${me.id}`, 20, 60_000)) {
      return createErrorResponse('Rate limit exceeded. Please try again later.', 429);
    }

    // Treat path param as Clerk user ID to delete
    const { id } = params;
    const targetClerkId = decodeURIComponent(id);
    if (!targetClerkId || typeof targetClerkId !== 'string') {
      return createErrorResponse('Invalid target user id', 400);
    }

    // 1) Delete in Clerk first (prevents future logins)
    const res = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(targetClerkId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
    });
    if (!res.ok) {
      let details = null;
      try { details = await res.json(); } catch {}
      const message = details?.errors?.[0]?.message || `Clerk deletion failed (status ${res.status})`;
      return createErrorResponse(message, 502, details);
    }

    // 2) Remove from Convex (best-effort; guarded against last SuperAdmin)
    try {
      await fetchMutation(api.users.remove, {
        clerkId: me.id,
        targetClerkId,
      });
    } catch (convexErr) {
      // Log but do not fail the overall operation since Clerk deletion succeeded
      console.warn('Convex cleanup failed after Clerk delete:', convexErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return createErrorResponse('Error deleting user', 500, error.message);
  }
}
