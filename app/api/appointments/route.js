/**
 * Appointments API Route
 * 
 * comments added using claude ai
 * prompt : "add proper comments and documentation to this file"
 * 
 * This file handles HTTP requests for managing appointments in the application.
 * It provides two main endpoints:
 * - GET: Retrieve all appointments for the authenticated user
 * - POST: Create a new appointment for a client
 * 
 * @module app/api/appointments/route
 */

// Import NextResponse - a utility from Next.js for creating HTTP responses
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Import Prisma client instance - used for database operations
import { prisma } from "@/lib/prisma.js";

/**
 * GET Handler - Retrieves all appointments for the authenticated user
 * 
 * This function:
 * 1. Authenticates the user using Clerk
 * 2. Finds the user in our database
 * 3. Fetches all appointments scheduled by this user
 * 4. Formats the appointment data for the frontend
 * 
 * @param {Request} req - The incoming HTTP request object
 * @returns {NextResponse} JSON response containing appointments array or error
 */
export async function GET(req) {
  try {
    // Extract userId from Clerk authentication
    // This checks if the user is logged in and gets their unique ID
    const { userId } = getAuth(req);
    
    // If no userId exists, the user is not authenticated
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the user in our database using their Clerk ID
    // We need the database user ID to query appointments
    const dbUser = await prisma.user.findUnique({
      where: { clerk_user_id: userId },
    });

    // If user doesn't exist in our database, return 404 error
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch all appointments where this user is the scheduler
    const appointments = await prisma.appointment.findMany({
      where: {
        scheduled_by_user_id: dbUser.id, // Filter by user who created the appointment
      },
      include: {
        client: true, // Also fetch related client data (JOIN operation)
      },
      orderBy: {
        appointment_date: "asc", // Sort appointments by date, earliest first
      },
    });

    // Transform the raw database data into a frontend-friendly format
    const mapped = appointments.map((a) => {
      // Ensure appointment_date is a proper Date object
      // (it might be a string if coming from JSON)
      const date = a.appointment_date instanceof Date 
        ? a.appointment_date 
        : new Date(a.appointment_date);
      
      // Ensure appointment_time is a proper Date object
      const time = a.appointment_time instanceof Date 
        ? a.appointment_time 
        : new Date(a.appointment_time);

      // Return transformed appointment object
      return {
        ...a, // Spread all original appointment properties
        date: date.toISOString().split("T")[0], // Format date as "YYYY-MM-DD"
        time: time.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }), // Format time as "HH:MM AM/PM"
        clientName: `${a.client.client_first_name} ${a.client.client_last_name}`, // Combine client names
      };
    });

    // Return the transformed appointments as JSON
    return NextResponse.json(mapped);
    
  } catch (error) {
    // Log any errors to the server console for debugging
    console.error("Error fetching appointments:", error);
    
    // Return a generic error response to the client
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * POST Handler - Creates a new appointment
 * 
 * This function:
 * 1. Authenticates the user
 * 2. Validates or creates a client
 * 3. Processes date/time data to avoid timezone issues
 * 4. Creates the appointment in the database
 * 
 * @param {Request} req - The incoming HTTP request object with appointment data
 * @returns {NextResponse} JSON response with created appointment or error
 */
export async function POST(req) {
  try {
    // Authenticate user using Clerk (same as GET handler)
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user in database (same as GET handler)
    const dbUser = await prisma.user.findUnique({
      where: { clerk_user_id: userId },
    });
    
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse the JSON body from the request
    // This contains the appointment details sent from the frontend
    const body = await req.json();
    
    // Destructure (extract) the required fields from the request body
    const { 
      client_id,          // ID of the client (might be null)
      appointment_date,   // Date string (e.g., "2025-01-15")
      appointment_time,   // Time string (e.g., "14:30")
      type,               // Appointment type (e.g., "Individual Session")
      duration,           // Duration (e.g., "50 min")
      details             // Additional notes
    } = body;

    // Initialize clientId variable
    let clientId = client_id;

    // CLIENT VALIDATION: Check if a client_id was provided
    if (!clientId) {
      // If no client provided, create a fallback test client
      // This prevents the appointment creation from failing
      const newClient = await prisma.client.create({
        data: {
          client_first_name: "Test",
          client_last_name: "Client",
          user_id: dbUser.id,
          status: "Active",
          risk_level: "Low",
        },
      });
      clientId = newClient.id;
    } else {
      // If client_id was provided, ensure it's an integer
      // (JSON might send it as a string)
      clientId = parseInt(clientId, 10);
    }

    // DATE/TIME PROCESSING
    // Create a date-only object to avoid timezone offset issues
    // By using "T00:00:00", we set the time to midnight in local timezone
    const dateOnly = new Date(`${appointment_date}T00:00:00`);

    // Parse the time string (e.g., "14:30" becomes hours=14, minutes=30)
    const [hours, minutes] = appointment_time.split(':').map(Number);

    if (isNaN(hours) || isNaN(minutes)) {
      return NextResponse.json({ error: "Invalid time format. Please use HH:mm." }, { status: 400 });
    }

    
    // Create a Date object for the appointment time
    // Start with the date, then set the specific hours and minutes
    const timeVal = new Date(dateOnly);
    timeVal.setHours(hours, minutes, 0, 0); // Set hours, minutes, seconds, milliseconds

    // CREATE APPOINTMENT in database
    const appointment = await prisma.appointment.create({
      data: {
        client_id: clientId,                    // Link to client
        appointment_date: dateOnly,             // Store date without time
        appointment_time: timeVal,              // Store full datetime for time
        type: type || "Individual Session",    // Use provided type or default
        duration: duration || "50 min",        // Use provided duration or default
        details: details || "Routine check-in session", // Use provided details or default
        status: "scheduled",                    // New appointments are "scheduled"
        scheduled_by_user_id: dbUser.id,       // Link to user who created it
      },
      include: {
        client: true, // Include client data in response
      },
    });

    // Add a formatted date string to the response object
    // This makes it easier for the frontend to display the date
    const created = { 
      ...appointment, 
      date: appointment.appointment_date.toISOString().split("T")[0] 
    };
    
    // Return the created appointment with 201 (Created) status code
    return NextResponse.json(created, { status: 201 });
    
  } catch (error) {
    // Log any errors to the server console
    console.error("Error creating appointment:", error);
    
    // Return error response to client
    return NextResponse.json({ 
      error: "Internal Server Error" 
    }, { status: 500 });
  }
}