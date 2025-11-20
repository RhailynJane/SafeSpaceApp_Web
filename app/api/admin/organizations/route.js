import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';

// List organizations visible to superadmin; fallback empty for non-superadmin
export async function GET(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try superadmin list; if fails, attempt to return just user's org
    let orgs = [];
    try {
      orgs = await fetchQuery(api.organizations.list, { clerkId: userId });
    } catch {
      // Not superadmin: fetch user to derive its org
      try {
        const user = await fetchQuery(api.users.getByClerkId, { clerkId: userId });
        if (user?.orgId) {
          orgs = [ { _id: user.orgId, name: user.orgId, slug: user.orgId } ];
        }
      } catch {}
    }

    return NextResponse.json({ organizations: orgs.map(o => ({
      id: o._id || o.slug,
      name: o.name || o.slug,
      slug: o.slug,
    })) });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json({ organizations: [] }, { status: 200 });
  }
}