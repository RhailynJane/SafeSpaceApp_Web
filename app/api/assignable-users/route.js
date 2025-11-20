/**
 * API Route: Assignable Users
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
 * of users who can be assigned clients.
 */

import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

/**
 * GET Handler Function
 * 
 * This function runs when someone makes a GET request to /api/assignable-users
 * It doesn't take any parameters because it returns all assignable users
 */
export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user from Convex
    const dbUser = await convex.query(api.users.getByClerkId, {
      clerkId: userId,
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check permissions
    const allowedRoles = ["admin", "team_leader", "superadmin"];
    if (!allowedRoles.includes(dbUser.roleId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all users from Convex (will be filtered by org access)
    const allUsers = await convex.query(api.users.list, {
      clerkId: userId,
    });

    // Filter for team_leader and support_worker roles
    const assignableUsers = allUsers.filter(user => 
      ['team_leader', 'support_worker'].includes(user.roleId)
    );

    // Transform to match expected format with role information
    const users = assignableUsers.map(user => ({
      ...user,
      role: {
        role_name: user.roleId,
      },
    }));

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