// app/api/admin/security-alerts/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(req) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = sessionClaims?.publicMetadata?.role;
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Mock security alerts - would come from security monitoring
    return NextResponse.json({ unreadAlerts: 0 });
  } catch (error) {
    console.error('Error fetching security alerts:', error);
    return NextResponse.json({ error: 'Failed to fetch security alerts' }, { status: 500 });
  }
}

