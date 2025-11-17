import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * @file This API route handles fetching a list of therapists from the database.
 * It is used to populate dropdowns or lists of therapists in the UI.
 */
export async function GET() {
  try {
    // Fetch users with role_name matching team_leader (therapists)
    const therapists = await prisma.user.findMany({
      where: {
        role: {
          role_name: { in: ['team_leader'] },
        },
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
      },
    });
    return NextResponse.json(therapists);
  } catch (error) {
    // If there is an error during the database query, log the error to the console.
    console.error('Error fetching therapists:', error);

    // Return a JSON response with an error message and a 500 Internal Server Error status.
    return NextResponse.json({ message: 'Error fetching therapists' }, { status: 500 });
  }
}
