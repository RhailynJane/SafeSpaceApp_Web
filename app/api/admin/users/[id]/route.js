
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeAdmin, validateId, createErrorResponse } from '@/lib/security';

/**
 * @file This API route handles deleting a specific user from the database.
 * It is a dynamic route where `[id]` is the ID of the user to be deleted.
 * This is a protected admin-only endpoint with proper authorization and input validation.
 */

/**
 * Handles DELETE requests to delete a user by their ID.
 * Requires admin or superadmin role.
 * @param {Request} request - The incoming HTTP request.
 * @param {object} { params } - The route parameters, containing the user ID.
 * @returns {NextResponse} A JSON response confirming the deletion or an error message.
 */
export async function DELETE(request, { params }) {
  // Authorize admin access
  const authResult = await authorizeAdmin(['admin', 'superadmin']);
  if (!authResult.authorized) {
    return authResult.error;
  }

  // Extract the user ID from the route parameters.
  const { id } = params;

  // Validate the ID parameter
  const validatedId = validateId(id);
  if (validatedId === null) {
    return createErrorResponse('Invalid user ID format', 400);
  }

  try {
    // Use Prisma to delete the user
    await prisma.user.delete({ where: { id: validatedId } });
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    // If there is an error during the database query, log the error to the console.
    console.error('Error deleting user:', error);

    // Return a JSON response with an error message and a 500 Internal Server Error status.
    return createErrorResponse('Error deleting user', 500, error.message);
  }
}
