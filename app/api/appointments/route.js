// app/api/appointments/route.js
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAuth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerk_user_id: userId },
    });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { client_id, time, type, duration, details } = body;

    // Get existing client or fallback to first one
    let clientId = client_id;
    if (!clientId) {
      const firstClient = await prisma.client.findFirst({
        where: { user_id: dbUser.id },
      });

      if (firstClient) {
        clientId = firstClient.id;
      } else {
        // Create a fallback client if none exist
        const newClient = await prisma.client.create({
          data: {
            client_first_name: "Test",
            client_last_name: "Client",
            user_id: dbUser.id,
            status: "Active",
            risk_level: "Low",
          },
        });
        clientId = newClient.id;
      }
    }

    // 🕒 Build appointment time/date
    const appointmentDate = new Date();
    const [hours, minutes] = (time || "09:00").split(":").map(Number);
    appointmentDate.setHours(hours);
    appointmentDate.setMinutes(minutes);
    appointmentDate.setSeconds(0);

    // ✅ Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        appointment_date: appointmentDate,
        appointment_time: appointmentDate,
        type: type || "Individual Session",
        duration: duration || "50 min",
        details: details || "Routine check-in session",
        status: "scheduled",
        scheduled_by_user_id: dbUser.id,
        client_id: clientId,
      },
      include: {
        client: true,
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
