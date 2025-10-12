// app/api/notes/[id]/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

// GET a single note by ID
export async function GET(request, { params }) {
  try {
    auth().protect();
    const { id } = params;
    const note = await prisma.note.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        client_id: true,
        author_user_id: true,
        note_date: true,
        session_type: true,
        summary: true,
        detailed_notes: true,
        risk_assessment: true,
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

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error(`Error fetching note ${params.id}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT (update) a note by ID
export async function PUT(request, { params }) {
  try {
    auth().protect();
    const { id } = params;
    const data = await request.json();

    const updatedNote = await prisma.note.update({
      where: { id: Number(id) },
      data: {
        ...data,
        note_date: new Date(data.note_date),
        updated_at: new Date(),
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

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error(`Error updating note ${params.id}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE a note by ID
export async function DELETE(request, { params }) {
  try {
    auth().protect();
    const { id } = params;

    await prisma.note.delete({
      where: { id: Number(id) },
    });

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error(`Error deleting note ${params.id}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
