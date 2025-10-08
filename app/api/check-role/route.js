// comments added with the help of Gemini - prompt { add comment on this file}
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * API route to fetch the role of the currently authenticated user.
 * @param {Request} req The incoming request object.
 * @returns {NextResponse} The response containing the user's role or an error.
 *
 * 
 */
export async function GET(req) {
  // Extract the userId from the request using Clerk's getAuth
  const { userId } = getAuth(req);

  // Check if the user is authenticated
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Query the database for the user using their Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerk_user_id: userId },
    });

    // Check if a user record exists in the database for the Clerk ID
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return the user's role. Use null if the role field is not set.
    return NextResponse.json({ role: user.role || null });
  } catch (error) {
    // Log the error for server-side debugging
    console.error('Error checking user role:', error);
    // Return a generic error response to the client
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}