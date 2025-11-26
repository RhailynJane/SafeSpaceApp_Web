import { auth } from '@clerk/nextjs/server';
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

// GET → Fetch all real reports from DB
export async function GET(request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fetchMetrics = searchParams.get('metrics');

    if (fetchMetrics === 'true') {
      const trackingData = await getTrackingData();
      return NextResponse.json(trackingData);
    }

    const reports = await prisma.reports.findMany({
      orderBy: { created_at: 'desc' },
    });
    return NextResponse.json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

// POST → Create a new report with real metrics
export async function POST(request) {
  try {
    const { name, type, data } = await request.json();

    const newReport = await prisma.reports.create({
      data: { name, type, data },
    });

    return NextResponse.json(newReport, { status: 201 });
  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json({ error: "Failed to create report" }, { status: 500 });
  }
}