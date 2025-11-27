import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

/**
 * @file This API route handles fetching a list of therapists from the database.
 * It is used to populate dropdowns or lists of therapists in the UI.
 */
export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch users with team_leader role (therapists) from Convex
    const users = await convex.query(api.users.list, {
      clerkId: userId,
      roleId: 'team_leader',
    });

    // Transform to match expected format
    const therapists = users.map(user => ({
      id: user._id,
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
    }));

    return NextResponse.json(therapists);
  } catch (error) {
    // If there is an error during the database query, log the error to the console.
    console.error('Error fetching therapists:', error);

    // Return a JSON response with an error message and a 500 Internal Server Error status.
    return NextResponse.json({ message: 'Error fetching therapists' }, { status: 500 });
  }
}
