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
import { auth } from "@clerk/nextjs/server";

// Import prisma - Pre-configured Prisma client instance for database operations
import { prisma } from "@/lib/prisma";

// Import NextResponse - Next.js helper for creating API responses
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
export async function GET() {
  try {
    // Step 1: Authenticate the user using Clerk
    // Extract the Clerk user ID from the current session
    // Note: auth() is async and must be awaited (different from getAuth())
    const { userId } = await auth();
    
    // Step 2: Find the user in our database using their Clerk ID
    // We need to link the Clerk authentication ID to our database user record
    const user = await prisma.user.findUnique({
      where: { clerk_user_id: userId },
    });

    // Step 3: Verify user exists in database
    if (!user) {
      // User is authenticated in Clerk but doesn't exist in our database
      // This could happen if user was deleted from DB but Clerk session still active
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Step 4: Calculate today's date range
    // We need to find all appointments from midnight today to 11:59:59 PM today
    // this part of code is written using gemini assist
    
    // Get the current date and time
    const today = new Date();
    
    // Create start of day: today at 00:00:00.000 (midnight)
    // setHours modifies the date object and returns the timestamp
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    
    // Create end of day: today at 23:59:59.999 (one millisecond before midnight)
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Step 5: Query database for today's appointments
    // Fetch appointments scheduled today
    const appointments = await prisma.appointment.findMany({
      where: {
        // Filter 1: Only appointments scheduled by this user
        scheduled_by_user_id: user.id,
        
        // Filter 2: Appointment date is within today's range
        // gte = greater than or equal to (>=)
        // lte = less than or equal to (<=)
        // This creates a range: startOfDay <= appointment_date <= endOfDay
        appointment_date: { gte: startOfDay, lte: endOfDay },
      },
      
      // Include related client information in the result
      // This performs a JOIN operation to fetch client details
      include: {
        client: true, // Adds the full client object to each appointment
      },
      
      // Sort appointments by date/time in ascending order (earliest first)
      orderBy: { appointment_date: "asc" },
    });

    // Step 6: Transform the appointments data for frontend consumption
    // Map over each appointment to ensure proper date formatting
    const mapped = appointments.map(a => ({
      ...a, // Spread operator: copy all properties from original appointment
      
      // Format the date as YYYY-MM-DD for consistent frontend display
      // Uses ternary operator to handle both Date objects and strings
      date: (a.appointment_date instanceof Date 
        ? a.appointment_date 
        : new Date(a.appointment_date))
        .toISOString()    // Convert to ISO format: "2024-03-15T14:30:00.000Z"
        .split('T')[0]    // Split at 'T' and take first part: "2024-03-15"
    }));

    // Step 7: Return the formatted appointments array
    return NextResponse.json(mapped);
    
  } catch (error) {
    // Catch any unexpected errors (database failures, network issues, etc.)
    console.error("Error fetching today's schedule:", error);
    
    // Return error response with the error message
    // Note: Exposing error.message in production could be a security risk
    // Consider using a generic message in production: "Internal Server Error"
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}