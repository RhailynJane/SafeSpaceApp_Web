// app/api/admin/security-alerts/route.js
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    console.log('Security Alerts API: userId', userId);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized: No user ID in request" }), { status: 401 });
    }

    // Check if the user is an admin
    const user = await prisma.user.findUnique({
      where: { clerk_user_id: userId },
      include: { roles: true },
    });
    console.log('Security Alerts API: user from DB', user);

    if (user?.roles?.role_name !== 'admin') {
        return new Response(JSON.stringify({ error: "Unauthorized: User is not an admin" }), { status: 403 });
    }

    const unreadAlerts = await prisma.systemAlert.count({
      where: {
        is_read: false,
      },
    });

    return NextResponse.json({ unreadAlerts });
  } catch (error) {
    console.error('Error fetching security alerts:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch security alerts', details: error.message }), { status: 500 });
  }
}
