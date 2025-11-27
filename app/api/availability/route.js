import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma.js";
import { NextResponse } from "next/server";

/**
 * GET /api/availability
 * Fetches the availability for the currently authenticated user.
 * Returns an array of objects with day and time range.
 * Example response:
 * [
 *   { day: "Monday", time: "09:00 AM - 05:00 PM" },
 *   { day: "Tuesday", time: "10:00 AM - 04:00 PM" }
 * ]
 */
export async function GET(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerk_user_id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const availability = await prisma.availability.findMany({
      where: { userId: user.id },
      select: { day: true, startTime: true, endTime: true },
      orderBy: { day: "asc" },
    });

    // Map database results to frontend-friendly format
    const formattedAvailability = availability.map(a => ({
      day: a.day,
      time: `${a.startTime} - ${a.endTime}`
    }));

    return NextResponse.json(formattedAvailability, { status: 200 });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { message: "Error fetching availability", error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/availability
 * Creates or updates availability for the currently authenticated user.
 * Expects body to be an array of objects like:
 * [
 *   { "day": "Monday", "time": "09:00 AM - 05:00 PM" },
 *   { "day": "Tuesday", "time": "10:00 AM - 04:00 PM" }
 * ]
 */
export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerk_user_id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const newAvailability = await request.json();

    if (!Array.isArray(newAvailability)) {
      return NextResponse.json({ error: "Invalid payload format" }, { status: 400 });
    }

    // Transaction: delete old availability and insert new
    await prisma.$transaction(async (tx) => {
      // Remove existing availability for this user
      await tx.availability.deleteMany({ where: { userId: user.id } });

      for (const avail of newAvailability) {
        if (!avail.day || !avail.time) continue;

        const [startTime, endTime] = avail.time.split(" - ").map(t => t.trim());

        // Basic validation: check start and end time exist
        if (!startTime || !endTime) continue;

        await tx.availability.upsert({
          where: { userId_day: { userId: user.id, day: avail.day } },
          update: { startTime, endTime },
          create: { userId: user.id, day: avail.day, startTime, endTime },
        });
      }
    });

    return NextResponse.json({ message: "Availability updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating availability:", error);
    return NextResponse.json(
      { message: "Error updating availability", error: error.message },
      { status: 500 }
    );
  }
}
