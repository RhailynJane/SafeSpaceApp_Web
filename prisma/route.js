import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

/**
 * GET /api/schedule
 * Fetches sessions for the currently authenticated user.
 * - If the user is a patient, it returns their sessions.
 * - If the user is a therapist, it returns their sessions.
 * - It can be filtered by a date range using `start` and `end` query params.
 */
export async function GET(request) {
  try {
    const { userId: clerk_user_id } = getAuth(request);
    if (!clerk_user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerk_user_id },
      include: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const whereClause = {
      ...(start && { start_time: { gte: new Date(start) } }),
      ...(end && { end_time: { lte: new Date(end) } }),
    };

    if (user.role.role_name === "patient") {
      whereClause.patient_id = user.id;
    } else if (["therapist", "support_worker"].includes(user.role.role_name)) {
      whereClause.therapist_id = user.id;
    }
    // Admins/Team Leaders could see all sessions, logic can be added here.

    const sessions = await prisma.session.findMany({
      where: whereClause,
      include: {
        patient: { select: { first_name: true, last_name: true } },
        therapist: { select: { first_name: true, last_name: true } },
        sessionType: true,
      },
      orderBy: {
        start_time: "asc",
      },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/schedule
 * Creates a new session.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    // Add validation for the body here (e.g., using Zod)

    const newSession = await prisma.session.create({
      data: body,
    });
    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}