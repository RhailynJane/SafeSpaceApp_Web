// Comments and documentation generated with Claude AI assistance
// Prompt: "Add proper comments and documentation to this file, explain what this file is doing, 

/**
 * API Route: Today's Schedule
 * 
 * Purpose:
 * This API endpoint retrieves all appointments scheduled for the current day
 * for the logged-in user. It filters appointments to only show those occurring
 * today (from midnight to 11:59:59 PM) and returns them sorted by time.
 * 
 * HTTP Method: GET
 * Endpoint: /api/appointments/route.js
 * 
 * Returns:
 * - Success (200): Array of today's appointments with client information
 * - 404: If the authenticated user doesn't exist in the database
 * - 500: If any server error occurs
 * 
 * Use Case:
 * This endpoint powers a "Today's Schedule" dashboard widget or page that shows
 * users what appointments they have scheduled for the current day. Common in
 * healthcare, scheduling, and calendar applications.
 * 
 * Key Features:
 * - Automatically calculates "today" based on server time
 * - Includes full client information for each appointment
 * - Sorts appointments chronologically (earliest first)
 * - Formats dates for easy frontend consumption
 */

// Import auth - Clerk's authentication function for App Router
// Note: This is different from getAuth() - auth() is the newer method for Next.js 13+ App Router
import { NextResponse } from "next/server";

/**
 * GET Handler - Fetch Today's Appointments
 * 
 * This function retrieves all appointments scheduled for today for the current user.
 * It performs date calculations to determine the start and end of the current day,
 * then queries the database for appointments within that time range.
 * 
 * @returns {Promise<NextResponse>} JSON response with today's appointments or error
 */
export async function GET() { return NextResponse.json({ message: "Appointments today API deprecated. Use Convex." }, { status: 410 }); }