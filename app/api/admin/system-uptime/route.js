// app/api/admin/system-uptime/route.js
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
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

    // In a real-world scenario, you would have a mechanism to track system uptime.
    // For a serverless environment like Vercel, this is not straightforward to calculate.
    // We will return a simulated value for now.
    const uptime = '99.9%';

    return NextResponse.json({ uptime });
  } catch (error) {
    console.error('Error fetching system uptime:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch system uptime' }), { status: 500 });
  }
}
