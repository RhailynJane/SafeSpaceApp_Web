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

    return NextResponse.json(auditLogs);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { message: "Error fetching audit logs", error: error.message },
      { status: 500 }
    );
  }
}
