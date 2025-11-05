import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

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

    let data;

    switch (reportType) {
      case 'caseload': {
        const clientsInDateRange = await prisma.client.count({
          where: { last_session_date: dateFilter },
        });
        const totalClients = await prisma.client.count();

        data = {
          reportType: 'Caseload',
          clientsWithSessions: clientsInDateRange,
          totalClients,
        };
        break;
      }

      case 'sessions': {
        const totalSessions = await prisma.appointment.count({
          where: { appointment_date: dateFilter },
        });
        const individualSessions = await prisma.appointment.count({
          where: { type: 'Individual Session', appointment_date: dateFilter },
        });

        data = {
          reportType: 'Sessions',
          totalSessions,
          sessionsByType: {
            Individual: individualSessions,
            Group: totalSessions - individualSessions,
          },
        };
        break;
      }

      case 'crisis': {
        const totalEvents = await prisma.crisisEvent.count({
          where: { event_date: dateFilter },
        });
        const resolvedEvents = await prisma.crisisEvent.count({
          where: { resolved: true, event_date: dateFilter },
        });

        data = {
          reportType: 'Crisis Events',
          totalEvents,
          resolved: resolvedEvents,
          pending: totalEvents - resolvedEvents,
        };
        break;
      }

      case 'outcomes': {
        // Example: dynamic stats based on outcomes table (replace with real fields)
        const totalOutcomes = await prisma.outcome.count({
          where: { created_at: dateFilter },
        });

        data = {
          reportType: 'Outcomes',
          totalOutcomes,
          satisfactionScore: 4.5, // placeholder example
          improvementRate: '85%',
        };
        break;
      }

      default:
        return new NextResponse("Invalid report type", { status: 400 });
    }

    // Return generated data directly (no saving to DB)
    return NextResponse.json({
      success: true,
      generatedAt: new Date(),
      data,
    });

  } catch (error) {
    console.error("[REPORTS_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST /api/reports - Adds a new report
export async function POST(request) {
    const newReport = await request.json();
    
    const reportToAdd = {
      ...newReport,
      id: reports.length + 1, // Simple ID generation
      date: new Date().toISOString().split('T')[0],
      size: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`
    };
    reports.unshift(reportToAdd); // Add to the beginning of the list
    return NextResponse.json(reportToAdd, { status: 201 });
}