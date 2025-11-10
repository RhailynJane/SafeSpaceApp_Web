// app/api/appointments/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma.js";
import { getAuth } from "@clerk/nextjs/server";

/**
 * GET: Fetch all appointments for the logged-in user
 * Returns appointments with:
 *  - clientName
 *  - date (YYYY-MM-DD)
 *  - time (HH:mm)
 *  - type, duration, details, status
 */
export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { clerk_user_id: userId } });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Fetch appointments for this user
    const appointments = await prisma.appointment.findMany({
      where: { scheduled_by_user_id: dbUser.id },
      include: { client: true }, // get client info
      orderBy: { appointment_date: "asc" },
    });

    const mapped = appointments.map(a => {
      // Format date
      const date = a.appointment_date instanceof Date ? a.appointment_date : new Date(a.appointment_date);

      // Format time safely
      let timeStr = "";
      if (a.appointment_time instanceof Date) {
        timeStr = a.appointment_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (typeof a.appointment_time === "string") {
        timeStr = a.appointment_time;
      }

      return {
        id: a.id,
        client_id: a.client_id,
        client: a.client, // Pass the full client object
        clientName: a.client ? `${a.client.client_first_name} ${a.client.client_last_name}` : "Unknown",
        date: date.toISOString().split("T")[0],
        time: timeStr,
        appointment_time: a.appointment_time, // Pass original time value
        type: a.type,
        duration: a.duration,
        details: a.details,
        status: a.status,
      };
    });

    return NextResponse.json(mapped);

  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST: Create a new appointment for the logged-in user
 * Expects JSON body:
 *  { client_id, appointment_date, appointment_time, type, duration, details }
 */
export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { clerk_user_id: userId } });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();
    let { client_id, appointment_date, appointment_time, type, duration, details } = body;

    if (!client_id) {
      // fallback: create dummy client
      const newClient = await prisma.client.create({
        data: { client_first_name: "Test", client_last_name: "Client", user_id: dbUser.id, status: "Active", risk_level: "Low" }
      });
      client_id = newClient.id;
    } else {
      client_id = parseInt(client_id, 10);
    }

    // Ensure date/time are correct
    const dateOnly = new Date(`${appointment_date}T00:00:00`);
    const [hours, minutes] = appointment_time.split(":").map(Number);
    const timeVal = new Date(dateOnly);
    timeVal.setHours(hours, minutes, 0, 0);

    const appointment = await prisma.appointment.create({
      data: {
        client_id,
        appointment_date: dateOnly,
        appointment_time: timeVal,
        type: type || "Individual Session",
        duration: duration || "50 min",
        details: details || "Routine check-in session",
        status: "scheduled",
        scheduled_by_user_id: dbUser.id,
      },
      include: { client: true },
    });

    return NextResponse.json(appointment, { status: 201 });

  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}