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
      include: { role: true },
    });

    if (user?.role?.role_name !== 'admin') {
        return new Response(JSON.stringify({ error: "Unauthorized: User is not an admin" }), { status: 403 });
    }

    const totalUsers = await prisma.user.count();

    return NextResponse.json({ totalUsers });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch metrics' }), { status: 500 });
  }
}