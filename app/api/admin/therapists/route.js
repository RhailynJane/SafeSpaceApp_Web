import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * @file This API route handles fetching a list of therapists from the database.
 * It is used to populate dropdowns or lists of therapists in the UI.
 */
export async function GET() {
  try {
    // Query via Prisma - assumes 'users' table maps to a Prisma model (User)
    const therapists = await prisma.$queryRaw`SELECT id, first_name, last_name FROM users WHERE role = 'therapist'`;
    return NextResponse.json(therapists);
  } catch (error) {
    // If there is an error during the database query, log the error to the console.
    console.error('Error fetching therapists:', error);

    // Return a JSON response with an error message and a 500 Internal Server Error status.
    return NextResponse.json({ message: 'Error fetching therapists' }, { status: 500 });
  }
}
