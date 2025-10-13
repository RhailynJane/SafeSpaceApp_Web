
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = params;
    const crisisEvent = await prisma.crisis_event.findUnique({
      where: { id: Number(id) },
    });

    if (!crisisEvent) {
      return NextResponse.json({ error: "Crisis event not found" }, { status: 404 });
    }

    return NextResponse.json(crisisEvent);
  } catch (error) {
    console.error(`Error fetching crisis event ${params.id}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = params;
    const data = await request.json();

    const updatedCrisisEvent = await prisma.crisis_event.update({
      where: { id: Number(id) },
      data: {
        event_type: data.event_type,
        event_date: data.event_date ? new Date(data.event_date) : undefined,
        description: data.description,
        risk_level_at_event: data.risk_level_at_event,
        intervention_details: data.intervention_details,
        contact_method: data.contact_method,
        contact_purpose: data.contact_purpose,
        urgency_level: data.urgency_level,
        supervisor_contacted_user_id: data.supervisor_contacted_user_id,
        updated_at: new Date(),
      },
    });

    return NextResponse.json(updatedCrisisEvent);
  } catch (error) {
    console.error(`Error updating crisis event ${params.id}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = params;

    await prisma.crisis_event.delete({
      where: { id: Number(id) },
    });

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error(`Error deleting crisis event ${params.id}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
