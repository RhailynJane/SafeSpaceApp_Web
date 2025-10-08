/**
 * File: app/api/referrals/[id]/route.js
 * Purpose: Handle API routes for fetching, updating, and deleting a specific referral record by ID.
 * 
 * Reference: Comments and documentation in this file were added with assistance from ChatGPT (OpenAI, 2025)
 */

import { auth, currentUser } from "@clerk/nextjs/server";  // Clerk authentication helpers
import { NextResponse } from "next/server";                // Used to create HTTP responses in Next.js
import { prisma } from "@/lib/prisma";                     // Prisma client for interacting with PostgreSQL database

/**
 * =====================
 * GET /api/referrals/[id]
 * =====================
 * Fetch a specific referral record by its unique ID.
 */
export async function GET(req, { params }) {
  try {
    const { id } = await params; // Extracts referral ID from the route parameters
    const referral = await prisma.referral.findUnique({ where: { id: parseInt(id) } }); // Fetches the referral record with matching ID

    if (!referral)
      return NextResponse.json({ error: "Not found" }, { status: 404 }); // If not found, return a 404 response

    // Return the found referral as JSON
    return NextResponse.json({ referral });
  } catch (err) {
    console.error("GET /api/referrals/[id] error:", err); // Log errors for debugging
    return NextResponse.json({ error: "Failed to fetch referral" }, { status: 500 }); // Return a 500 error if anything fails
  }
}

/**
 * =====================
 * PATCH /api/referrals/[id]
 * =====================
 * Update a referral record by ID.
 * Only the referral creator or an admin is authorized to perform this action.
 */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;              // Extracts the referral ID from route parameters
    const { userId } = await auth();          // Get the authenticated user's ID from Clerk
    const user = await currentUser();         // Fetch the full user details from Clerk
    
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); // Reject if no user is logged in

    // Check if referral exists in the database
    const referral = await prisma.referral.findUnique({ where: { id: parseInt(id) } });
    if (!referral)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Check the role of the logged-in user
    const role = user?.publicMetadata?.role;      // Custom user role from Clerk metadata
    const isAdmin = role === "admin";             // True if user is an admin
    const isOwner = referral.createdByClerkUserId === user.id; // True if the referral was created by this user
    
    // Only allow admin or owner to update
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse the request body for updated data
    const body = await req.json();

    // Update the referral record in the database
    const updated = await prisma.referral.update({
      where: { id: parseInt(id) },
      data: body,
    });

    // Return the updated referral
    return NextResponse.json({ referral: updated });
  } catch (err) {
    console.error("PATCH /api/referrals/[id] error:", err);
    return NextResponse.json({ error: "Failed to update referral" }, { status: 500 });
  }
}

/**
 * =====================
 * DELETE /api/referrals/[id]
 * =====================
 * Delete a referral record by ID.
 * Only the referral creator or an admin is allowed to delete it.
 */
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;              // Extract the referral ID from route parameters
    const { userId } = await auth();          // Verify if the user is authenticated
    const user = await currentUser();         // Fetch full user info from Clerk
    
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check if the referral exists
    const referral = await prisma.referral.findUnique({ where: { id: parseInt(id) } });
    if (!referral)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Role-based access check
    const role = user?.publicMetadata?.role;
    const isAdmin = role === "admin";
    const isOwner = referral.createdByClerkUserId === user.id;

    // Only admin or the original creator can delete the record
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete the referral record from the database
    await prisma.referral.delete({ where: { id: parseInt(id) } });
    
    // Return success message
    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    console.error("DELETE /api/referrals/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete referral" }, { status: 500 });
  }
}