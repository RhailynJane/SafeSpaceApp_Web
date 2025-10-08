import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * @file This API route handles fetching audit logs from the database.
 * It is intended for admin use to review user activities.
 */
export async function GET() {
  try {
    // Query the database to get all records from the audit_logs table.
    // The results are ordered by timestamp in descending order to show the most recent logs first.
    const { rows } = await pool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC');
    
    // Return the fetched audit logs as a JSON response with a 200 OK status.
    return NextResponse.json(rows);
  } catch (error) {
    // If there is an error during the database query, log the error to the console.
    console.error('Error fetching audit logs:', error);
    
    // Return a JSON response with an error message and a 500 Internal Server Error status.
    return NextResponse.json({ message: 'Error fetching audit logs' }, { status: 500 });
  }
}
