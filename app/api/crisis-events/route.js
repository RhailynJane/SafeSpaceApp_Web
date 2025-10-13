
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const crisisEvents = await prisma.crisis_event.findMany({
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(crisisEvents, { status: 200 });
  } catch (error) {
    console.error("Error fetching crisis events:", error);
    return NextResponse.json(
      { message: "Error fetching crisis events", error: error.message },
      { status: 500 }
    );
  }
}

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

    const data = await request.json();

    const crisisEvent = await prisma.crisis_event.create({
      data: {
        client_id: data.client_id,
        initiator_user_id: user.id,
        event_type: data.event_type,
        event_date: new Date(data.event_date),
        description: data.description,
        risk_level_at_event: data.risk_level_at_event,
        intervention_details: data.intervention_details,
        contact_method: data.contact_method,
        contact_purpose: data.contact_purpose,
        urgency_level: data.urgency_level,
        supervisor_contacted_user_id: data.supervisor_contacted_user_id,
      },
    });

    return NextResponse.json(crisisEvent, { status: 201 });
  } catch (error) {
    console.error("Error creating crisis event:", error);
    return NextResponse.json(
      { message: "Error creating crisis event", error: error.message },
      { status: 500 }
    );
  }
}
