// app/api/admin/metrics/route.js
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

    console.log('User from DB:', user);

    if (user?.roles?.role_name !== 'admin') {
        await prisma.systemAlert.create({
          data: {
            message: `Unauthorized access attempt to /api/admin/metrics by user ${userId}`,
            type: 'security',
          },
        });
        return new Response(JSON.stringify({ error: "Unauthorized: User is not an admin" }), { status: 403 });
    }

    let totalUsers = 0;
    try {
      totalUsers = await prisma.user.count();
    } catch (countError) {
      console.error('Error counting users:', countError);
      // Optionally, log this to system alerts or a more persistent error tracking system
    }

    return NextResponse.json({ totalUsers });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch metrics', details: error.message }), { status: 500 });
  }
}