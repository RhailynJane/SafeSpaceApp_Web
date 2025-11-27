// app/api/admin/system-uptime/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { resolveUserRole } from '@/lib/security';

export async function GET(req) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = await resolveUserRole(userId, sessionClaims);
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Mock uptime - in production, this would come from monitoring service
    return NextResponse.json({ uptime: '99.9%' });
  } catch (error) {
    console.error('Error fetching system uptime:', error);
    return NextResponse.json({ error: 'Failed to fetch system uptime' }, { status: 500 });
  }
}

