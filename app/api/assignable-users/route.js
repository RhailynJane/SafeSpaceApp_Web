// app/api/assignable-users/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: {
          role_name: {
            in: ['team_leader', 'support_worker'],
          },
        },
      },
      include: {
        role: true,
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching assignable users:', error);
    return NextResponse.json({ message: 'Error fetching assignable users' }, { status: 500 });
  }
}
