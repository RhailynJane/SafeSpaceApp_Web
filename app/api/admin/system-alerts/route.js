import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * @file This API route handles fetching system alerts from the database.
 * It is intended for admin use to monitor system-wide notifications.
 */
export async function GET() {
  try {
    // Query the database to get all records from the system_alerts table.
    // The results are ordered by timestamp in descending order to show the most recent alerts first.
    const alerts = await prisma.$queryRaw`SELECT * FROM system_alerts ORDER BY timestamp DESC`;
    return NextResponse.json(alerts);
  } catch (error) {
    // If there is an error during the database query, log the error to the console.
    console.error('Error fetching system alerts:', error);

    // Return a JSON response with an error message and a 500 Internal Server Error status.
    return NextResponse.json({ message: 'Error fetching system alerts' }, { status: 500 });
  }
}
