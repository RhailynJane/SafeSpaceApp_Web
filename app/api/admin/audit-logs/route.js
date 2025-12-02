// app/api/admin/audit-logs/route.js
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

async function getConvexClient() {
  const { getToken } = await auth();
  let token = null;
  try {
    const template = process.env.CLERK_JWT_TEMPLATE_NAME || "convex";
    token = await getToken({ template });
  } catch (e) {
    console.warn("Clerk getToken failed; falling back:", e?.message || e);
    try { token = await getToken(); } catch (_) { token = null; }
  }
  
  const client = new ConvexHttpClient(convexUrl);
  if (token) client.setAuth(token);
  
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const logs = await client.query(api.auditLogs.list, {
      limit: limit ? parseInt(limit) : 1000,
      startDate: startDate ? parseInt(startDate) : undefined,
      endDate: endDate ? parseInt(endDate) : undefined,
    });

    // Pass through enriched fields for better filtering on UI
    const auditLogs = logs.map(log => ({
      id: log._id,
      action: log.action,
      details: log.details || '',
      timestamp: log.timestamp,
      type: 'audit',
      userId: log.userId || null,
      userName: log.userName || (log.userId ? 'User' : 'System'),
      userRole: log.userRole || null,
      orgName: log.orgName || null,
      orgSlug: log.orgSlug || null,
      orgId: log.orgId || null,
    }));

    return NextResponse.json(auditLogs);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json([], { status: 200 }); // Return empty array to prevent page crashes
  }
}
