import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * @file This API route handles fetching reports from the database.
 * It is intended for admin use to retrieve and display generated reports.
 */
export async function GET() {
  try {
    // Query the database to get all records from the reports table.
    // The results are ordered by report_date in descending order.
    const { rows } = await pool.query('SELECT * FROM reports ORDER BY report_date DESC');
    
    // Return the fetched reports as a JSON response with a 200 OK status.
    return NextResponse.json(rows);
  } catch (error) {
    // If there is an error during the database query, log the error to the console.
    console.error('Error fetching reports:', error);
    
    // Return a JSON response with an error message and a 500 Internal Server Error status.
    return NextResponse.json({ message: 'Error fetching reports' }, { status: 500 });
  }
}
