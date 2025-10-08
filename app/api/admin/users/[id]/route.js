
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * @file This API route handles deleting a specific user from the database.
 * It is a dynamic route where `[id]` is the ID of the user to be deleted.
 */

/**
 * Handles DELETE requests to delete a user by their ID.
 * @param {Request} request - The incoming HTTP request.
 * @param {object} { params } - The route parameters, containing the user ID.
 * @returns {NextResponse} A JSON response confirming the deletion or an error message.
 */
export async function DELETE(request, { params }) {
  // Extract the user ID from the route parameters.
  const { id } = params;
  
  try {
    // Execute a DELETE query to remove the user with the specified ID from the users table.
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    
    // Return a success message as a JSON response with a 200 OK status.
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    // If there is an error during the database query, log the error to the console.
    console.error('Error deleting user:', error);
    
    // Return a JSON response with an error message and a 500 Internal Server Error status.
    return NextResponse.json({ message: 'Error deleting user' }, { status: 500 });
  }
}
