// app/api/auth/login/route.ts

/**
 *  Reference:
 * This file was commented with the assistance of ChatGPT (OpenAI GPT-5).
 *
 *  Prompt Used:
 * "add comments for my Next.js API route that checks if a user is logged in using Clerk authentication."
 *
 *  Purpose:
 * This API route handles authentication verification.
 * It checks if a user is currently logged in through Clerk and returns user information if authenticated.
 */

import { currentUser } from "@clerk/nextjs/server"; 
// Imports the `currentUser` function from Clerk’s server-side package.
// This function retrieves details about the currently signed-in user on the server.

import { NextResponse } from "next/server"; 
// Imports Next.js's `NextResponse` utility, used to send structured JSON responses from API routes.

export async function GET() { 
// Defines an asynchronous GET handler function for the `/api/auth/login` endpoint.
// This will be automatically triggered when a GET request is made to this route.

  try { 
    // The `try` block is used to handle any runtime errors that may occur when fetching user data.

    const user = await currentUser(); 
    // Calls Clerk’s `currentUser()` function asynchronously to fetch the current authenticated user.
    // If the user is not signed in, this returns `null` or `undefined`.

    if (!user) 
      return NextResponse.json({ authenticated: false }, { status: 200 });
    // If no user is found (meaning not logged in), return a JSON response:
    // { authenticated: false } with HTTP status 200.
    // This tells the frontend that no user session currently exists.

    // Return a minimal user object (do not leak sensitive fields)
    return NextResponse.json({
      authenticated: true, // Indicates the user is logged in
      id: user.id, // Clerk’s unique ID for the user
      email: user.emailAddresses?.[0]?.emailAddress ?? null, 
      // Optional chaining used to safely get the first email address of the user.
      // If not found, returns `null` to avoid errors.
      firstName: user.firstName ?? null, // User’s first name, or null if missing
      lastName: user.lastName ?? null, // User’s last name, or null if missing
      publicMetadata: user.publicMetadata ?? null, 
      // Optional metadata associated with the user (like role, preferences, etc.)
      // Exposed only if it’s safe for frontend access.
    });

  } catch (err) { 
    // The `catch` block handles unexpected errors during user lookup or response handling.

    console.error("auth/login error:", err); 
    // Logs the error to the server console for debugging.

    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
    // Sends an HTTP 500 (Internal Server Error) response with a short error message.
  }
}
