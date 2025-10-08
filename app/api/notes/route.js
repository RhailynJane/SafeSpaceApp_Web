import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { userId, sessionClaims } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notes = await prisma.note.findMany({
      include: {
        author: true,
        client: true,
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(notes, { status: 200 });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { message: "Error fetching notes", error: error.message },
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

    const data = await request.json();

    const note = await prisma.note.create({
      data: {
        client_id: data.client_id,
        author_user_id: data.author_user_id,
        note_date: new Date(data.note_date),
        session_type: data.session_type,
        duration_minutes: data.duration_minutes,
        summary: data.summary,
        detailed_notes: data.detailed_notes,
        risk_assessment: data.risk_assessment,
      },
      include: {
        author: true,
        client: true,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { message: "Error creating note", error: error.message },
      { status: 500 }
    );
  }
}