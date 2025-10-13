import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

/**
 * GET /api/schedule
 * Fetches all sessions for the authenticated user.
 * A team-leader sees all sessions, a support-worker sees only their own.
 */
export async function GET(request) {
  try {
    const { userId, sessionClaims } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the internal user ID from the Clerk user ID
    const user = await prisma.user.findUnique({
      where: { clerk_user_id: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    const sessions = await prisma.session.findMany({
      where: {
        OR: [
          { therapist_id: user.id },
          { patient_id: user.id },
        ],
      },
      include: {
        patient: { select: { first_name: true, last_name: true, email: true } },
        therapist: { select: { first_name: true, last_name: true, email: true } },
        sessionType: true,
      },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}