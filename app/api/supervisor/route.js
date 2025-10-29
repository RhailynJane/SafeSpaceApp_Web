
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Assuming the first team leader found is the supervisor for simplicity
    const supervisor = await prisma.user.findFirst({
      where: {
        role: { role_name: 'team_leader' },
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
      }
    });

    if (!supervisor) {
      return NextResponse.json({ error: 'Supervisor not found' }, { status: 404 });
    }

    return NextResponse.json(supervisor);
  } catch (error) {
    console.error('Error fetching supervisor:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
