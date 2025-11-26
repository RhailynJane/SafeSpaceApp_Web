
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    console.log("Audit logs API: Clerk userId:", userId);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the user in our database using their Clerk ID
    const dbUser = await prisma.user.findUnique({
      where: { clerk_user_id: userId },
    });
    console.log("Audit logs API: dbUser:", dbUser);

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        user_id: dbUser.id, // Use the internal user ID
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
