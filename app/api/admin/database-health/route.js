// app/api/admin/database-health/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';

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

    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Error checking database health:', error);
    return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
  }
}
