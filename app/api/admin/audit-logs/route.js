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
  }
}