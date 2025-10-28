// app/api/admin/audit-logs/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized: No user ID in request" }), { status: 401 });
    }

    // Check if the user is an admin
    const user = await prisma.user.findUnique({
      where: { clerk_user_id: userId },
      include: { roles: true },
    });

    if (user?.roles?.role_name !== 'admin') {
        return new Response(JSON.stringify({ error: "Unauthorized: User is not an admin" }), { status: 403 });
    }


    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit');

    const auditLogsPromise = prisma.auditLog.findMany({
      take: limit ? parseInt(limit) : undefined,
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
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