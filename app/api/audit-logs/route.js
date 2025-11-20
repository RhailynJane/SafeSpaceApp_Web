import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get audit logs from Convex for this user
    const auditLogs = await convex.query(api.auditLogs.getByUser, { userId, limit: 100 });

    // Map to legacy format for compatibility
    const mappedLogs = auditLogs.map(log => ({
      id: log._id,
      user_id: log.userId,
      action: log.action,
      entity_type: log.entityType || null,
      entity_id: log.entityId || null,
      details: log.details || null,
      timestamp: new Date(log.timestamp).toISOString(),
      created_at: new Date(log.timestamp).toISOString(),
      actor_id: log.userId,
    }));

    return NextResponse.json(mappedLogs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
