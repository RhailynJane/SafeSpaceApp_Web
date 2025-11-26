import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function DELETE(req, { params }) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const appointmentId = Number(params.id);

    // Pull the appointment AND the client AND the scheduler's Clerk id
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: {
          select: { user_id: true } // numeric user id of client owner
        },
        scheduled_by: {
          select: { clerk_user_id: true } // clerk id of scheduler
        }
      }
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // AUTHORIZATION:
    // A user can delete if:
    // - They scheduled it (matching Clerk user ID)
    // - They own the client (matching numeric ID mapped to user table)
    const isScheduler = appointment.scheduled_by?.clerk_user_id === userId;
    const isClientOwner = appointment.client?.user_id === appointment.scheduled_by?.id;

    if (!isScheduler && !isClientOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete
    await prisma.appointment.delete({
      where: { id: appointmentId },
    });

    return NextResponse.json(
      { message: 'Appointment deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
