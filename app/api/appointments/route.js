
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { userId: clerkUserId } = getAuth(req);
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerk_user_id: clerkUserId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        OR: [
          { scheduled_by_user_id: user.id },
          { client: { user_id: user.id } }
        ]
      },
      include: {
        client: true,
      },
      orderBy: {
        appointment_date: 'asc',
      },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { userId: clerkUserId } = getAuth(req);
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerk_user_id: clerkUserId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { client_id, appointment_date, appointment_time, type, duration, details } = body;

    if (!client_id || !appointment_date || !appointment_time || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const appointmentDateTime = new Date(`${appointment_date}T${appointment_time}`);

    const newAppointment = await prisma.appointment.create({
      data: {
        client_id,
        scheduled_by_user_id: user.id,
        appointment_date: new Date(appointment_date),
        appointment_time: appointmentDateTime,
        type,
        duration,
        details,
        status: 'Scheduled',
      },
      include: {
        client: true,
      }
    });

    return NextResponse.json(newAppointment, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
