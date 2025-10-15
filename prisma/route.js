import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * DELETE /api/appointments/[id]
 * Deletes a specific appointment by its ID.
 */
export async function DELETE(request, { params }) {
  const { id } = params;

  try {
    await prisma.appointment.delete({
      where: { id },
    });
    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error("Failed to delete appointment:", error);
    // Handle cases where the record is not found, etc.
    return NextResponse.json({ message: "Error deleting appointment" }, { status: 500 });
  }
}