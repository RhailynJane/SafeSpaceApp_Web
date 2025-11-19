import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Replace this with your DB query later
    const trackingData = {
      progressMetrics: {
        sessionsCompleted: 12,
        goalsAchieved: 6,
        improvementRate: "72%",
      },
      teamPerformance: {
        activeStaff: 4,
        avgCaseload: 19,
        satisfactionScore: 88,
      }
    };

    return NextResponse.json(trackingData);
  } catch (error) {
    console.error("Tracking API Error:", error);
    return NextResponse.json({ error: "Failed to load tracking data" }, { status: 500 });
  }
}
