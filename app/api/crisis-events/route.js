import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/convex-server.js";

export async function GET(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const convex = await getConvexClient();
    
    // Get crisis stats and event logs
    const [crisisStats, eventLog, safetyStats, highRiskClients] = await Promise.all([
      convex.query(api.crisis.getCrisisStats, { daysBack: 30 }),
      convex.query(api.crisis.getCristsEventLog, { limit: 50, daysBack: 30 }),
      convex.query(api.safetyIndicators.getSafetyStats, { daysBack: 30 }),
      convex.query(api.safetyIndicators.getHighRiskClients, { daysBack: 30 }),
    ]);

    return NextResponse.json({
      crisisStats,
      eventLog,
      safetyStats,
      highRiskClients,
    });
  } catch (error) {
    console.error("Error fetching crisis events:", error);
    return NextResponse.json(
      { message: "Error fetching crisis events", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const convex = await getConvexClient();

    // Log a crisis resource access
    if (body.type === "trackResourceAccess") {
      await convex.mutation(api.crisis.trackAction, {
        resourceId: body.resourceId,
        action: body.action, // 'call' | 'view' | 'visit'
        userId: userId,
      });

      // Also log as a safety indicator if it's a crisis access
      if (body.action === "call") {
        await convex.mutation(api.safetyIndicators.logIndicator, {
          clientId: userId,
          source: "crisis_access",
          indicatorType: "crisis_resource_accessed",
          severity: "medium",
          description: `Client accessed crisis resource: ${body.resourceTitle || "Unknown"}`,
          relatedData: JSON.stringify({ resourceId: body.resourceId, action: body.action }),
        });
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { message: "Invalid request type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error creating crisis event:", error);
    return NextResponse.json(
      { message: "Error creating crisis event", error: error.message },
      { status: 500 }
    );
  }
}

