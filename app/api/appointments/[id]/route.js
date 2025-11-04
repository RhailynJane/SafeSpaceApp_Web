// Comments and documentation generated with Claude AI assistance
// Prompt: "Add proper comments and documentation to this file

/**
 * API Route: Delete Appointment
 * 
 * Purpose:
 * This API endpoint handles the deletion of a specific appointment from the database.
 * It includes security checks to ensure only authorized users can delete appointments.
 * 
 * HTTP Method: DELETE
 * Endpoint: /api/appointments/[id] (where [id] is the appointment ID)
 * 
 * Path Parameters:
 * - id: The unique identifier of the appointment to delete
 * 
 * Returns:
 * - Success (200): Confirmation message that appointment was deleted
 * - 401: If user is not authenticated
 * - 403: If user is not authorized to delete this specific appointment
 * - 404: If appointment with given ID doesn't exist
 * - 500: If any server error occurs
 * 
 * Authorization Logic:
 * A user can delete an appointment if they are either:
 * 1. The person who scheduled the appointment (scheduled_by_user_id matches)
 * 2. The owner of the client associated with the appointment (client.user_id matches)
 * 
 * Use Case:
 * When a user clicks "Delete" on an appointment in the UI, this endpoint is called
 * to permanently remove that appointment from the database.
 */

// Import NextResponse - Next.js helper for creating API responses
import { NextResponse } from 'next/server';

// Import PrismaClient - the database ORM client class
import { PrismaClient } from '@prisma/client';

// Import getAuth - Clerk authentication helper to identify logged-in user
import { getAuth } from '@clerk/nextjs/server';

// Create a new instance of Prisma client for database operations
// This establishes the connection to your database
const prisma = new PrismaClient();

/**
 * DELETE Handler Function
 * 
 * This function runs when someone makes a DELETE request to /api/appointments/[id]
 * It verifies the user's identity and authorization before deleting the appointment.
 * 
 * @param {Request} req - The incoming HTTP request object (contains auth info)
 * @param {Object} params - Object containing route parameters
 * @param {Object} params.params - Nested params object with the appointment ID
 * @param {string} params.params.id - The ID of the appointment to delete
 * @returns {Promise<NextResponse>} JSON response with success message or error
 */
export async function DELETE(req, { params }) {
  try {
    // Step 1: Authenticate the user using Clerk
    // Extract the Clerk user ID from the request to identify who's making this request
    const { userId } = getAuth(req);
    
    // Security check: ensure user is logged in
    // Without authentication, we don't know who's trying to delete the appointment
    if (!userId) {
      // Return 401 Unauthorized if no user is logged in
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Step 2: Extract the appointment ID from the URL path parameters
    // Example: If URL is /api/appointments/123, then id = "123"
    const { id } = params;
    
    // Convert the ID from string to integer
    // URL parameters are always strings, but database IDs are typically integers
    // parseInt(id, 10) means: parse 'id' as a base-10 (decimal) integer
    const appointmentId = parseInt(id, 10);

    // Step 3: Query the database to check if this appointment exists
    // We need to verify the appointment exists before trying to delete it
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }, // Filter: find appointment with this specific ID
    });

    // Step 4: Check if appointment was found in the database
    if (!appointment) {
      // If no appointment with this ID exists, return 404 Not Found
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Step 5: Authorization check - verify user has permission to delete this appointment
    // Optional security layer: ensures users can only delete their own appointments
    // A user is authorized if they either:
    // 1. Scheduled the appointment (appointment.scheduled_by_user_id === userId)
    // 2. Own the client (appointment.client.user_id === userId)
    // The && means "AND" - if NEITHER condition is true, deny access
    if (appointment.scheduled_by_user_id !== userId && appointment.client.user_id !== userId) {
        // Return 403 Forbidden if user doesn't have permission
        // This is different from 401 (not logged in) - they ARE logged in, just not authorized
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Step 6: Delete the appointment from the database
    // At this point, we've verified:
    // - User is authenticated (logged in)
    // - Appointment exists
    // - User has permission to delete it
    await prisma.appointment.delete({
      where: { id: appointmentId }, // Specify which appointment to delete
    });

    // Step 7: Return success response
    // Status 200 indicates successful deletion
    return NextResponse.json({ message: 'Appointment deleted successfully' }, { status: 200 });
    
  } catch (error) {
    // Catch any unexpected errors that occurred during the process
    // This could include database connection failures, validation errors, etc.
    console.error('Error deleting appointment:', error);
    
    // Return a generic error response to the client
    // Status 500 indicates an internal server error (something went wrong on our end)
    return NextResponse.json({ error: 'Internal ServerError' }, { status: 500 });
  }
}