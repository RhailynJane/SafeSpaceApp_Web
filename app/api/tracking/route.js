
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

    const user = await prisma.user.findUnique({ where: { clerk_user_id: userId }, include: { role: true } });
    if (!user || user.role.role_name !== 'team_leader') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // These are placeholder calculations. In a real application, these would be complex queries.
    const sessionsCompleted = await prisma.appointment.count({ where: { status: 'Completed' } });
    const activeStaff = await prisma.user.count({ where: { role: { role_name: 'support_worker' } } });
    const totalClients = await prisma.client.count();
    const avgCaseload = activeStaff > 0 ? totalClients / activeStaff : 0;

    const trackingData = {
      progressMetrics: {
        sessionsCompleted: sessionsCompleted,
        goalsAchieved: 23, // Placeholder
        improvementRate: "78%", // Placeholder
      },
      teamPerformance: {
        activeStaff: activeStaff,
        avgCaseload: avgCaseload.toFixed(1),
        satisfactionScore: "4.2/5", // Placeholder
      },
    };

    return NextResponse.json(trackingData);
  } catch (error) {
    console.error('Error fetching tracking data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
