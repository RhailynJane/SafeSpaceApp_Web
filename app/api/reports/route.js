import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const reports = await prisma.report.findMany({
      orderBy: {
        date: 'desc',
      },
    });
    return NextResponse.json(reports);
  } catch (error) {
    console.error("[REPORTS_GET_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { reportType, dateRange } = await request.json();

    if (!dateRange || !dateRange.from || !dateRange.to) {
      return new NextResponse("Invalid date range", { status: 400 });
    }

    const dateFilter = {
      gte: new Date(dateRange.from),
      lte: new Date(dateRange.to),
    };

    // Data generation logic based on reportType and dateRange
    let data;
    switch (reportType) {
      case 'caseload':
        const clientsInDateRange = await prisma.client.count({ where: { last_session_date: dateFilter } });
        data = {
          clientsWithSessions: clientsInDateRange,
          totalClients: await prisma.client.count(),
        };
        break;
      case 'sessions':
        const totalSessions = await prisma.appointment.count({ where: { appointment_date: dateFilter } });
        const individualSessions = await prisma.appointment.count({ where: { type: 'Individual Session', appointment_date: dateFilter } });
        data = {
          totalSessions,
          averageDuration: 50, // This could be calculated if you store end times
          sessionsByType: { 'Individual': individualSessions, 'Group': totalSessions - individualSessions },
        };
        break;
      case 'crisis':
        const totalEvents = await prisma.crisisEvent.count({ where: { event_date: dateFilter } });
        const resolvedEvents = await prisma.crisisEvent.count({ where: { resolved: true, event_date: dateFilter } });
        data = {
          totalEvents,
          resolved: resolvedEvents,
          pending: totalEvents - resolvedEvents,
        };
        break;
      case 'outcomes':
        // This is more complex and depends on your data model for outcomes.
        // Here's a placeholder for what it might look like.
        data = {
          goalsAchieved: 42,
          satisfactionScore: 4.5,
          improvementRate: '85%',
        };
        break;
      default:
        return new NextResponse("Invalid report type", { status: 400 });
    }

    // Save the generated report to the database
    const newReport = await prisma.report.create({
      data: {
        name: `${reportType} Report`,
        type: 'PDF', // Or determine dynamically
        data: JSON.stringify(data), // Store data as a JSON string
        date: new Date(),
      }
    });
    return NextResponse.json(newReport);
  } catch (error) {
    console.error("[REPORTS_POST_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}