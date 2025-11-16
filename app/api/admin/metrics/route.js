// app/api/admin/metrics/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: No user ID in request" }, { status: 401 });
    }

    // Check if the user is an admin
    const userRole = sessionClaims?.publicMetadata?.role;
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      return NextResponse.json({ error: "Unauthorized: User is not an admin" }, { status: 403 });
    }

    // Resolve the current user's org in Convex and scope metrics to it
    const currentUser = await fetchQuery(api.users.getByClerkId, { clerkId: userId });
    const orgId = currentUser?.orgId || null;

    if (!orgId) {
      // Explicitly require org scoping for admin metrics (CMHA-only)
      return NextResponse.json({ error: 'No organization associated with current user' }, { status: 400 });
    }

    const stats = await fetchQuery(api.users.getOrgUserStats, { clerkId: userId, orgId });
    return NextResponse.json({ totalUsers: stats.total, byRole: stats.byRole, active: stats.active, inactive: stats.inactive, suspended: stats.suspended });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics', details: error.message }, { status: 500 });
  }
}