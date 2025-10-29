// app/api/admin/clerk-health/route.js
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
  try {
    console.log('Clerk Health API: Request received');
    const { userId } = getAuth(req);
    console.log('Clerk Health API: userId', userId);
    if (!userId) {
      console.log('Clerk Health API: Unauthorized - No user ID');
      return new Response(JSON.stringify({ error: "Unauthorized: No user ID in request" }), { status: 401 });
    }

    // Check if the user is an admin
    const user = await prisma.user.findUnique({
      where: { clerk_user_id: userId },
      include: { roles: true },
    });
    console.log('Clerk Health API: user from DB', user);

    if (user?.roles?.role_name !== 'admin') {
        console.log('Clerk Health API: Unauthorized - User is not admin');
        return new Response(JSON.stringify({ error: "Unauthorized: User is not an admin" }), { status: 403 });
    }

    // Make a simple call to Clerk API to check its health
    console.log('Clerk Health API: Calling clerkClient.users.getCount()');
    await clerkClient.users.getCount();
    console.log('Clerk Health API: clerkClient.users.getCount() successful');

    return NextResponse.json({ status: 'connected' });
  } catch (error) {
    console.error('Error checking Clerk.js health:', error);
    return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
  }
}
