import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * @file This API route handles fetching a list of therapists from the database.
 * It is used to populate dropdowns or lists of therapists in the UI.
 */
export async function GET() {
  try {
    // Query the database to get the id, first_name, and last_name of all users with the 'therapist' role.
    const { rows } = await pool.query("SELECT id, first_name, last_name FROM users WHERE role = 'therapist'");
    
    // Return the fetched therapists as a JSON response with a 200 OK status.
    return NextResponse.json(rows);
  } catch (error) {
    // If there is an error during the database query, log the error to the console.
    console.error('Error fetching therapists:', error);
    
    // Return a JSON response with an error message and a 500 Internal Server Error status.
    return NextResponse.json({ message: 'Error fetching therapists' }, { status: 500 });
  }
}
