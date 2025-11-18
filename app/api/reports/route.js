import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function getTrackingData() {
  const [
    sessionsCompleted,
    totalClients,
    activeStaff,
    goalsAchieved,
    progressRatings,
    satisfactionRatings,
  ] = await Promise.all([
    prisma.appointment.count({
      where: { status: 'confirmed' },
    }),
    prisma.client.count(),
    prisma.user.count({
      where: { roles: { role_name: { not: 'client' } } },
    }),
    prisma.note.count({
      where: {
        session_type: 'goal_setting',
        progress_rating: 5,
      },
    }),
    prisma.note.findMany({
      where: { progress_rating: { not: null } },
      select: { progress_rating: true },
    }),
    prisma.appointment.findMany({
      where: { status: 'confirmed', satisfaction_rating: { not: null } },
      select: { satisfaction_rating: true },
    }),
  ]);

  const totalProgress = progressRatings.reduce((sum, note) => sum + note.progress_rating, 0);
  const improvementRate = progressRatings.length > 0 ? (totalProgress / progressRatings.length / 5) * 100 : 0;

  const totalSatisfaction = satisfactionRatings.reduce((sum, appt) => sum + appt.satisfaction_rating, 0);
  const satisfactionScore = satisfactionRatings.length > 0 ? (totalSatisfaction / satisfactionRatings.length / 5) * 100 : 0;

  return {
    progressMetrics: {
      sessionsCompleted: sessionsCompleted,
      goalsAchieved: goalsAchieved,
      improvementRate: `${improvementRate.toFixed(0)}%`,
    },
    teamPerformance: {
      activeStaff: activeStaff,
      avgCaseload: totalClients > 0 && activeStaff > 0 ? (totalClients / activeStaff).toFixed(1) : 0,
      satisfactionScore: `${satisfactionScore.toFixed(0)}%`,
    },
  };
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