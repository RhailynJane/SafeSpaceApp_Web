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
      include: { role: true },
    });

    if (user?.role?.role_name !== 'admin') {
        return new Response(JSON.stringify({ error: "Unauthorized: User is not an admin" }), { status: 403 });
    }


    const auditLogs = await prisma.auditLog.findMany({
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

    const formattedLogs = auditLogs.map(log => ({
      id: log.id,
      action: log.action,
      user: log.user ? `${log.user.first_name} ${log.user.last_name} (${log.user.email})` : 'System',
      timestamp: log.timestamp,
      details: log.details,
    }));

    return NextResponse.json(formattedLogs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch audit logs' }), { status: 500 });
  }
}