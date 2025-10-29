// app/api/referrals/route.js

/**
 *  Reference:
 * This file was documented with the assistance of ChatGPT (OpenAI GPT-5).
 *
 *  Fake Prompt Used:
 * "Please add detailed explanatory comments to my Next.js API route for handling referrals using Prisma and Clerk authentication."
 *
 *  Purpose:
 * This API route handles both fetching (`GET`) and creating (`POST`) referral records.
 * It uses Clerk for authentication and Prisma ORM for communication with the PostgreSQL database.
 */

import { auth, currentUser } from "@clerk/nextjs/server";
// `auth` retrieves the current session info (like userId).
// `currentUser` fetches full user details from Clerk, including public metadata like role.

import { prisma } from "@/lib/prisma";
// Imports the Prisma client instance that manages all database interactions (connected to PostgreSQL).

import { NextResponse } from "next/server";
// Used to send JSON responses with status codes in Next.js API routes.


// ----------------------
// 📍 GET /api/referrals
// ----------------------
// Fetches all referral records — restricted to Admins and Team Leaders.
export async function GET() {
  console.log('Request received for /api/referrals');
  try {
    const { userId } = await auth(); 
    // Extracts the authenticated user’s ID from Clerk.
    // If no user is logged in, userId will be undefined.

    if (!userId) {
      // If no user is authenticated, return a 401 Unauthorized response.
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the most up-to-date user info (with role and metadata) from Clerk.
    const user = await currentUser();
    const role = user?.publicMetadata?.role; 
    // Extracts the user's role from their Clerk public metadata.

    console.log("API Auth check:", { userId, role });
    console.log("Full publicMetadata:", user?.publicMetadata);

    // Only these roles are allowed to access referral data.
    const allowedRoles = ["admin", "team_leader"];
    if (!allowedRoles.includes(role)) {
      // If the user’s role is not authorized, deny access.
      console.log("Access denied. Expected: admin or team_leader, Got:", role);
      return NextResponse.json(
        { 
          error: "Forbidden - Team Leader or Admin access required",
          yourRole: role,
          publicMetadata: user?.publicMetadata,
        },
        { status: 403 }
      );
    }

    console.log("✅ Access granted for role:", role);

    // Fetch all referrals from the database in descending order of creation.
    const referrals = await prisma.referral.findMany({
      orderBy: { created_at: "desc" },
    });

    // Return the list of referrals as a JSON response.
    return NextResponse.json(referrals, { status: 200 });

  } catch (error) {
    // Handles unexpected runtime or database errors.
    console.error("Error fetching referrals:", error);
    return NextResponse.json(
      { message: "Error fetching referrals", error: error.message },
      { status: 500 }
    );
  }
}


// ----------------------
// 📍 POST /api/referrals
// ----------------------
// Allows Admin users to create a new referral record in the database.
export async function POST(req) {
  try {
    const { userId } = await auth(); 
    // Checks if a valid Clerk session exists (authenticated user).

    if (!userId) {
      // If not logged in, return 401 Unauthorized.
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch full user info from Clerk to check their role.
    const user = await currentUser();
    const role = user?.publicMetadata?.role;

    // Only Admin users can create new referrals.
    if (role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required", yourRole: role },
        { status: 403 }
      );
    }

    // Parse the JSON body sent from the frontend request.
    const data = await req.json();

    // Create a new referral record in the database using Prisma.
    const referral = await prisma.referral.create({
      data: {
        client_first_name: data.client_first_name,
        client_last_name: data.client_last_name,
        age: data.age ? parseInt(data.age) : null, // Convert age to integer safely.
        phone: data.phone,
        address: data.address,
        email: data.email,
        emergency_first_name: data.emergency_first_name,
        emergency_last_name: data.emergency_last_name,
        emergency_phone: data.emergency_phone,
        referral_source: data.referral_source || "Unknown", // Default to "Unknown" if empty.
        reason_for_referral: data.reason_for_referral || "", // Optional field.
        additional_notes: data.additional_notes || "", // Optional field.
        submitted_date: new Date(), // Automatically set current date and time.
        status: "Pending", // Default status for new referrals.
      },
    });

    // Return the created referral record as confirmation with 201 Created status.
    return NextResponse.json(referral, { status: 201 });

  } catch (error) {
    // Log and handle any unexpected errors during creation.
    console.error("Error creating referral:", error);
    return NextResponse.json(
      { message: "Error creating referral", error: error.message },
      { status: 500 }
    );
  }
}
