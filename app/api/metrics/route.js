
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { userId: clerkUserId } = getAuth(req);
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerk_user_id: clerkUserId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(today.getUTCDate() + 1);

    const myClients = await prisma.client.count({ where: { user_id: user.id } });
    const todaysSessions = await prisma.appointment.count({
      where: {
        scheduled_by_user_id: user.id,
        appointment_date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });
    const highRiskClients = await prisma.client.count({ where: { user_id: user.id, risk_level: 'High' } });
    const pendingNotes = 1; // Placeholder

    const totalClients = await prisma.client.count();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const newClientsThisMonth = await prisma.client.count({
      where: {
        created_at: {
          gte: firstDayOfMonth,
        },
      },
    });
    const completedClients = await prisma.client.count({
      where: {
        status: {
          in: ['Completed', 'Archived'],
        },
      },
    });

    const metrics = {
        myClients,
        todaysSessions,
        highRiskClients,
        pendingNotes,
        totalClients,
        newClientsThisMonth,
        completedClients,
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
