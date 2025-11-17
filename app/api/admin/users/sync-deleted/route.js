import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { fetchQuery, fetchMutation } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { resolveUserRole, createErrorResponse, checkRateLimit } from '@/lib/security';

export async function POST() {
  try {
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Rate limit bulk syncs
    if (!checkRateLimit(`sync-deleted:${me.id}`, 3, 60_000)) {
      return createErrorResponse('Rate limit exceeded. Please try again later.', 429);
    }

    const role = await resolveUserRole(me.id, me.publicMetadata);
    if (role !== 'admin' && role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all non-deleted users (Convex list excludes deleted by default)
    const users = await fetchQuery(api.users.list, { clerkId: me.id });

    let checked = 0;
    let archived = 0;
    const failures = [];

    for (const u of users) {
      checked++;
      const userId = u.clerkId || u._id;
      try {
        const res = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(userId)}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
        });
        if (res.status === 404) {
          // Not in Clerk -> archive in Convex
          await fetchMutation(api.users.archive, { clerkId: me.id, targetClerkId: userId });
          archived++;
        } else if (!res.ok) {
          const err = await res.text();
          failures.push({ userId, error: err });
        }
      } catch (err) {
        failures.push({ userId, error: String(err?.message || err) });
      }
    }

    return NextResponse.json({ checked, archived, failures });
  } catch (error) {
    console.error('Sync deleted users failed:', error);
    return createErrorResponse('Sync failed', 500, error.message);
  }
}
