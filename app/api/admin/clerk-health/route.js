// app/api/admin/clerk-health/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { resolveUserRole } from '@/lib/security';

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = await resolveUserRole(userId, sessionClaims);
    if (role !== 'admin' && role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Simple Clerk call to validate connectivity
    await clerkClient.users.getCount();
    return NextResponse.json({ status: 'connected' });
  } catch (error) {
    console.error('Error checking Clerk.js health:', error);
    return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
  }
}
