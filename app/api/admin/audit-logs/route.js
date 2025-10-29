// app/api/admin/audit-logs/route.js
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma.js";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Only team leaders can access all audit logs
    const userRole = sessionClaims?.metadata?.role;
    if (userRole !== "team-leader") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const auditLogs = await prisma.auditLog.findMany({
      orderBy: {
        created_at: "desc",
      },
      include: {
        actor: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(auditLogs);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { message: "Error fetching audit logs", error: error.message },
      { status: 500 }
    );
      orderBy: {
        timestamp: 'desc',
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
      b.timestamp.getTime() - a.timestamp.getTime()
    );

    return NextResponse.json(combinedLogs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch audit logs', details: error.message }), { status: 500 });
  }
}