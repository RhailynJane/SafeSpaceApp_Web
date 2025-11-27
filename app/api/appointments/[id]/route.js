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