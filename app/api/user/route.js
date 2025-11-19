import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const clerkUserId = searchParams.get('clerkUserId');

  if (!clerkUserId) {
    return NextResponse.json({ error: 'Clerk User ID is required' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { clerk_user_id: clerkUserId },
      select: { id: true, first_name: true, last_name: true, email: true, role: { select: { role_name: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user by Clerk ID:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
