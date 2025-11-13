
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userWithAvailability = await prisma.user.findUnique({
      where: { clerk_user_id: userId },
      include: {
        user_availabilities: true,
      },
    });

    if (!userWithAvailability) {
      return new NextResponse(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return NextResponse.json(userWithAvailability.user_availabilities);
  } catch (error) {
    console.error('Failed to fetch availability:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
