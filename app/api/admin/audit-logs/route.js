// app/api/admin/audit-logs/route.js
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma.js";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { userId, sessionClaims } = await auth();
    console.log('sessionClaims', sessionClaims);
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit');

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Only admins can access all audit logs
    const userRole = sessionClaims?.publicMetadata?.role;
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const auditLogsPromise = prisma.auditLog.findMany({
      take: limit ? parseInt(limit) : undefined,
      orderBy: {
        timestamp: 'desc',
      },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    const systemAlertsPromise = prisma.systemAlert.findMany({
      take: limit ? parseInt(limit) : undefined,
      orderBy: {
        timestamp: 'desc',
      },
    });

    const [auditLogs, systemAlerts] = await Promise.all([
      auditLogsPromise,
      systemAlertsPromise,
    ]);

    const formattedAuditLogs = auditLogs.map(log => ({
      id: log.id,
      type: 'audit',
      action: log.action,
      user: log.user ? `${log.user.first_name} ${log.user.last_name} (${log.user.email})` : 'System',
      timestamp: log.timestamp,
      details: log.details,
    }));

    const formattedSystemAlerts = systemAlerts.map(alert => ({
      id: alert.id,
      type: 'alert',
      action: `System Alert: ${alert.type}`,
      user: 'System',
      timestamp: alert.timestamp,
      details: alert.message,
    }));

    const combinedLogs = [...formattedAuditLogs, ...formattedSystemAlerts].sort((a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    return NextResponse.json(combinedLogs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch audit logs', details: error.message }), { status: 500 });
  }
}
