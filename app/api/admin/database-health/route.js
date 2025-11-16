// app/api/admin/database-health/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = sessionClaims?.publicMetadata?.role;
    if (role !== 'admin' && role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const health = await fetchQuery(api.systemHealth.getHealthStatus, {});
    const status = health.status === 'healthy' ? 'ok' : health.status;
    return NextResponse.json({ status, dbLatency: health.database?.latency ?? null, timestamp: health.timestamp });
  } catch (error) {
    console.error('Error checking database health:', error);
    return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
  }
}
