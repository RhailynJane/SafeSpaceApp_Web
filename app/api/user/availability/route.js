import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
  try {
    const { userId: clerkUserId } = getAuth(req);

    if (!clerkUserId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // First, find the internal user ID from the clerk ID
    const user = await prisma.user.findUnique({
      where: {
        clerk_user_id: clerkUserId,
      },
      select: {
        id: true, // Only select the ID for efficiency
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Now, use the internal integer ID to find availability
    const userAvailability = await prisma.UserAvailability.findMany({
      where: {
        user_id: user.id,
      },
    });

    return NextResponse.json(userAvailability);
  } catch (error) {
    console.error('[AVAILABILITY_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}