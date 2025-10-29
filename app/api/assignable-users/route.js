/**
 * API Route: Assignable Users
 * 
 *  * // AI-generated documentation (Claude)
 * Prompt: Add proper comments and  line-by-line beginner explanations
 * 
 * Purpose:
 * This API endpoint retrieves all users who can be assigned tasks or responsibilities.
 * It specifically fetches users with roles of "team_leader" or "support_worker".
 * 
 * HTTP Method: GET
 * Endpoint: /api/assignable-users
 * 
 * Returns:
 * - Success: JSON array of user objects with their role information
 * - Error: JSON object with error message and 500 status code
 * 
 * Use Case:
 * This endpoint is typically called when you need to populate a dropdown or list
 * of users who can be assigned - clients.
 */

// Import NextResponse - a helper from Next.js to create API responses
import { NextResponse } from 'next/server';

// Import Prisma client - the database connection/query tool
import { prisma } from '@/lib/prisma';

/**
 * GET Handler Function
 * 
 * This function runs when someone makes a GET request to /api/assignable-users
 * It doesn't take any parameters because it returns all assignable users
 */
export async function GET() {
  try {
    // Query the database to find users with specific roles
    const users = await prisma.user.findMany({
      // Filter criteria: only get users with certain roles
      // written with Gemini Assistance
      where: {
        // Navigate into the user's role relationship
        role: {
          // Check the role_name field
          role_name: {
            // 'in' means "match any of these values"
            in: ['team_leader', 'support_worker'],
          },
        },
      },
      // Include related data: also fetch the full role information for each user
      include: {
        role: true, // This adds the complete role object to each user
      },
    });

    // Return the users as JSON with a 200 (success) status code
    return NextResponse.json(users);
    
  } catch (error) {
    // If anything goes wrong, log the error to the server console
    console.error('Error fetching assignable users:', error);
    
    // Return an error response with a 500 (server error) status code
    return NextResponse.json(
      { message: 'Error fetching assignable users' }, 
      { status: 500 }
    );
  }
}