import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma.js";
import { NextResponse } from "next/server";

/**
 * GET /api/availability
 * Fetches the availability for the currently authenticated user.
 */
export async function GET(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the internal user associated with the Clerk user ID
    const user = await prisma.user.findUnique({
      where: { clerk_user_id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch the availability for the found user
    const availability = await prisma.availability.findMany({
      where: {
        userId: user.id,
      },
      select: {
        day: true,
        startTime: true,
        endTime: true,
      },
    });

    return NextResponse.json(availability.map(a => ({ day: a.day, time: `${a.startTime} - ${a.endTime}` })), { status: 200 });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json({ message: "Error fetching availability", error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/availability
 * Creates or updates the availability for the currently authenticated user.
 */
export async function POST(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerk_user_id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const newAvailability = await request.json();

    // Transaction to delete old availability and create new ones
    await prisma.$transaction(async (tx) => {
      await tx.availability.deleteMany({
        where: { userId: user.id },
      });

      // Use a loop with upsert for each day to handle unique constraints gracefully
      for (const avail of newAvailability) {
        if (avail.time) {
          const [startTime, endTime] = avail.time.split(' - ');
          if (startTime && endTime) {
            await tx.availability.upsert({
              where: { userId_day: { userId: user.id, day: avail.day } },
              update: { startTime, endTime },
              create: {
                userId: user.id,
                day: avail.day,
                startTime,
                endTime,
              },
            });
          }
        }
      }
    });

    return NextResponse.json({ message: "Availability updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating availability:", error);
    return NextResponse.json({ message: "Error updating availability", error: error.message }, { status: 500 });
  }
}