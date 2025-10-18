import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();
    const user = await prisma.user.findUnique({
      where: { clerk_user_id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Fetch appointments scheduled today
    const appointments = await prisma.appointment.findMany({
      where: {
        scheduled_by_user_id: user.id,
        appointment_date: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        client: true,
      },
      orderBy: { appointment_date: "asc" },
    });

    const mapped = appointments.map(a => ({
      ...a,
      date: (a.appointment_date instanceof Date ? a.appointment_date : new Date(a.appointment_date)).toISOString().split('T')[0]
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Error fetching today's schedule:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
