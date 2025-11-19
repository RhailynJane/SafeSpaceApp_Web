// app/api/admin/active-sessions/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex-mobile/_generated/api';
import { resolveUserRole } from '@/lib/security';

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = await resolveUserRole(userId, sessionClaims);
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Determine org for current admin and count presence within that org
    const currentUser = await fetchQuery(api.users.getByClerkId, { clerkId: userId });
    const orgId = currentUser?.orgId || null;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization associated with current user' }, { status: 400 });
    }

    const activeSessions = await fetchQuery(api.presence.onlineCountByOrg, {
      clerkId: userId,
      orgId,
      sinceMs: 6 * 60 * 1000, // last 6 minutes considered online
    });

    return NextResponse.json({ activeSessions });
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch active sessions' }, { status: 500 });
  }
}
 
