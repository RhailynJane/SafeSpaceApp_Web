// app/api/admin/active-sessions/route.js
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized: No user ID in request" }), { status: 401 });
    }

    // Check if the user is an admin
    const user = await prisma.user.findUnique({
      where: { clerk_user_id: userId },
      include: { roles: true },
    });

    if (user?.roles?.role_name !== 'admin') {
        return new Response(JSON.stringify({ error: "Unauthorized: User is not an admin" }), { status: 403 });
    }

    const response = await clerkClient.sessions.getSessionList({
      userId: userId,
      status: 'active',
    });

    const activeSessions = response.totalCount;

    return NextResponse.json({ activeSessions });
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return new Response(JSON.stringify({ error: 'Failed to fetch active sessions', details: error.message }), { status: 500 });
  }
}
