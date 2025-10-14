// app/api/support-workers/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const supportWorkers = await prisma.user.findMany({
      where: { role: 'support_worker' },
      select: { id: true, first_name: true, last_name: true, email: true },
    });
    return NextResponse.json(supportWorkers);
  } catch (error) {
    console.error('Error fetching support workers:', error);
    return NextResponse.json({ message: 'Error fetching support workers' }, { status: 500 });
  }
}
