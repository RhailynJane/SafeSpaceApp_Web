// app/api/admin/audit-logs/route.js
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

async function getConvexClient() {
  const { getToken } = await auth();
  const token = await getToken({ template: "convex" });
  
  const client = new ConvexHttpClient(convexUrl);
  client.setAuth(token);
  
  return client;
}

export async function GET(req) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit');

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await getConvexClient();
    const logs = await client.query(api.auditLogs.list, {
      limit: limit ? parseInt(limit) : 100,
    });

    // Format logs for frontend
    const auditLogs = logs.map(log => ({
      id: log._id,
      action: log.action,
      details: log.details || '',
      timestamp: log.timestamp,
      type: 'audit',
      user: log.userId || 'System'
    }));

    return NextResponse.json(auditLogs);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json([], { status: 200 }); // Return empty array to prevent page crashes
  }
}
