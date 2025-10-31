import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma.js";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { userId, sessionClaims } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerk_user_id: userId },
      include: { roles: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.roles) {
      return NextResponse.json({ error: "User has no role assigned" }, { status: 403 });
    }

    const userRole = user.roles.role_name.replace(/_/g, "-");

    let notes;
    if (userRole === "support-worker") {
      const clients = await prisma.client.findMany({
        where: { user_id: user.id },
        select: { id: true },
      });
      const clientIds = clients.map((client) => client.id);

      notes = await prisma.note.findMany({
        where: { client_id: { in: clientIds } },
        select: {
          id: true,
          client_id: true,
          author_user_id: true,
          note_date: true,
          session_type: true,
          summary: true,
          detailed_notes: true,
          risk_assessment: true,
          next_steps: true,
          created_at: true,
          updated_at: true,
          client: {
            select: {
              id: true,
              client_first_name: true,
              client_last_name: true,
            },
          },
          author: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
      });
    } else {
      notes = await prisma.note.findMany({
        select: {
          id: true,
          client_id: true,
          author_user_id: true,
          note_date: true,
          session_type: true,
          summary: true,
          detailed_notes: true,
          risk_assessment: true,
          next_steps: true,
          created_at: true,
          updated_at: true,
          client: {
            select: {
              id: true,
              client_first_name: true,
              client_last_name: true,
            },
          },
          author: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
      });
    }

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

    const user = await prisma.user.findUnique({
      where: { clerk_user_id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const data = await request.json();

    const duration = data.duration_minutes ? parseInt(data.duration_minutes, 10) : null;

    const note = await prisma.note.create({
      data: {
        client_id: data.client_id,
        author_user_id: user.id,
        note_date: new Date(data.note_date),
        session_type: data.session_type,
        duration_minutes: isNaN(duration) ? null : duration,
        summary: data.summary,
        detailed_notes: data.detailed_notes,
        risk_assessment: data.risk_assessment,
        next_steps: data.next_steps,
      },
      select: {
        id: true,
        client_id: true,
        author_user_id: true,
        note_date: true,
        session_type: true,
        summary: true,
        detailed_notes: true,
        risk_assessment: true,
        next_steps: true,
        created_at: true,
        updated_at: true,
        client: {
          select: {
            id: true,
            client_first_name: true,
            client_last_name: true,
          },
        },
        author: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
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
