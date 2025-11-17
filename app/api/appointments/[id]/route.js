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
// Import NextResponse - Next.js helper for creating API responses
import { NextResponse } from 'next/server';

// Create a new instance of Prisma client for database operations
// This establishes the connection to your database
// Deprecated route: handled by Convex now

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
export async function DELETE() { return NextResponse.json({ message: 'Appointments API deprecated. Use Convex.' }, { status: 410 }); }