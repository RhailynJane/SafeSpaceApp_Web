
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportType, dateRange } = await req.json();

    // Fetch user to check role
    const user = await prisma.user.findUnique({ where: { clerk_user_id: userId }, include: { role: true } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let reportData = {};

    // TODO: Implement date range filtering

    if (reportType === "caseload") {
        const clients = await prisma.client.findMany({ where: { user_id: user.id } });
        reportData = {
            totalClients: clients.length,
            activeClients: clients.filter(c => c.status === "Active").length,
            onHoldClients: clients.filter(c => c.status !== "Active").length,
        };
    } else if (reportType === "sessions") {
        const appointments = await prisma.appointment.findMany({ 
            where: { scheduled_by_user_id: user.id },
            include: { client: true }
        });
        reportData = { sessions: appointments };
    } else if (reportType === "outcomes") {
        const clients = await prisma.client.findMany({ where: { user_id: user.id } });
        reportData = {
            highRisk: clients.filter(c => c.risk_level === "High").length,
            mediumRisk: clients.filter(c => c.risk_level === "Medium").length,
            lowRisk: clients.filter(c => c.risk_level === "Low").length,
        };
    } else if (reportType === "crisis") {
        const crisisEvents = await prisma.crisisEvent.findMany({ where: { initiator_user_id: user.id } });
        reportData = { crisisEvents };
    }

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
