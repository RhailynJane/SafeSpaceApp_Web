// app/api/appointments/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma.js";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(req) {
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

    const appointments = await prisma.appointment.findMany({
      where: {
        scheduled_by_user_id: dbUser.id,
      },
      include: {
        // client: true, // Temporarily removed to isolate the error
      },
      orderBy: {
        appointment_date: "asc",
      },
    });

    const mapped = appointments.map((a) => {
      const date = a.appointment_date instanceof Date ? a.appointment_date : new Date(a.appointment_date);
      const time = a.appointment_time instanceof Date ? a.appointment_time : new Date(a.appointment_time);

      return {
        ...a,
        date: date.toISOString().split("T")[0],
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        clientName: `${a.client.client_first_name} ${a.client.client_last_name}`,
      };
    });

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}


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
    const { client_id, appointment_date, appointment_time, type, duration, details } = body;

    let clientId = client_id;

    // If no client_id is provided, create a new client as a fallback
    if (!clientId) {
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
    } else {
      // Ensure client_id is an integer
      clientId = parseInt(clientId, 10);
    }

    // Construct appointment date and time
    const date = new Date(appointment_date);
    const [hours, minutes] = appointment_time.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);

    // ✅ Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        client_id: clientId,
        appointment_date: date,
        appointment_time: date,
        type: type || "Individual Session",
        duration: duration || "50 min",
        details: details || "Routine check-in session",
        status: "scheduled",
        scheduled_by_user_id: dbUser.id,
      },
      include: {
        client: true,
      },
    });

  // include `date` string on the created appointment as well
  const created = { ...appointment, date: appointment.appointment_date.toISOString().split("T")[0] };
  return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}