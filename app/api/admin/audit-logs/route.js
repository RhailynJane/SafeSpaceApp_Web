// app/api/admin/audit-logs/route.js
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { userId, sessionClaims } = await auth();
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit');

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Only admins can access all audit logs
    const userRole = sessionClaims?.publicMetadata?.role;
    if (userRole !== "admin" && userRole !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Mock audit logs until Convex schema is updated
    const auditLogs = [
      {
        id: '1',
        action: 'User Login',
        details: 'Admin user logged in successfully',
        timestamp: new Date().toISOString(),
        type: 'audit',
        user: 'Admin'
      },
      {
        id: '2',
        action: 'Settings Updated',
        details: 'System settings were modified',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: 'audit',
        user: 'Admin'
      }
    ];

    return NextResponse.json(limit ? auditLogs.slice(0, parseInt(limit)) : auditLogs);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { message: "Error fetching audit logs", error: error.message },
      { status: 500 }
    );
  }
}
