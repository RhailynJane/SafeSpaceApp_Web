// app/api/audit-logs/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(req) {
  try {
    // Step 1: get Clerk user ID from session
    const { userId: clerkUserId } = getAuth(req);
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Step 2: lookup internal numeric user ID
    const dbUser = await prisma.user.findUnique({
      where: { clerk_user_id: clerkUserId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Step 3: fetch audit logs using integer ID
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        user_id: dbUser.id, // must be integer
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    return NextResponse.json(auditLogs);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
