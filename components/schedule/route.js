import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

/**
 * GET /api/schedule/[id]
 * Fetches a single session by its ID.
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const session = await prisma.session.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        patient: { select: { first_name: true, last_name: true, email: true } },
        therapist: { select: { first_name: true, last_name: true, email: true } },
        sessionType: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error(`Error fetching session ${params.id}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * PATCH /api/schedule/[id]
 * Updates an existing session by its ID.
 */
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    // Optional: Add logic to ensure only authorized users (e.g., the therapist or an admin) can update.

    const updatedSession = await prisma.session.update({
      where: { id: parseInt(id, 10) },
      data: body,
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error(`Error updating session ${params.id}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * DELETE /api/schedule/[id]
 * Deletes a session by its ID.
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Optional: Add logic to ensure only authorized users can delete.

    await prisma.session.delete({
      where: { id: parseInt(id, 10) },
    });

    return new NextResponse(null, { status: 204 }); // 204 No Content
  } catch (error) {
    console.error(`Error deleting session ${params.id}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}