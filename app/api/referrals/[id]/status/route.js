/**
 * File: app/api/referrals/[id]/status/route.js (PATCH handler)
 * Purpose: Allows an Admin or Team Leader to update the status of a referral.
 * 
 * Reference: Comments and explanations were added with help from ChatGPT (OpenAI, 2025).
 */

import { auth, currentUser } from "@clerk/nextjs/server";  // Clerk functions for authentication and current user retrieval
import { prisma } from "@/lib/prisma";                     // Prisma client instance for database access
import { NextResponse } from "next/server";                // Next.js utility for structured API responses

/**
 * =====================
 * PATCH /api/referrals/[id]
 * =====================
 * Updates the status and adds a timeline entry for a referral record by its ID.
 * Only users with "admin" or "team_leader" roles are authorized.
 */
export async function PATCH(req, { params }) {
  try {
    // Extract the referral ID from the dynamic route parameter
    const { id } = await params;
    
    // Parse incoming JSON body from the request (contains status + optional note)
    const body = await req.json();
    const { status, note } = body;
    
    // Authenticate the user using Clerk
    const { userId } = await auth();

    // Reject if no authenticated user
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch full user info including metadata (like role)
    const user = await currentUser();
    const role = user?.publicMetadata?.role;
    
    // Define which roles are allowed to update referrals
    const allowedRoles = ["admin", "team_leader"];

    // Reject if user’s role is not authorized
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ 
        error: "Forbidden - Team Leader or Admin access required",
        yourRole: role 
      }, { status: 403 });
    }

    /**
     * Frontend might send a shorthand status like “accepted” or “declined”.
     * This mapping converts frontend-friendly statuses to database-friendly ones.
     */
    const statusMap = {
      "accepted": "Accepted",
      "declined": "Declined",
      "more-info-requested": "More Info Requested"
    };

    // Use the mapped database status if available, otherwise keep the same
    const dbStatus = statusMap[status] || status;

    console.log("Updating referral:", { id, status, dbStatus, note });

    /**
     * Update the referral record in the database.
     * - Sets new status (Accepted / Declined / More Info Requested)
     * - Adds a processed_date timestamp
     */
    const updatedReferral = await prisma.referral.update({
      where: { id: parseInt(id) },
      data: {
        status: dbStatus,
        processed_date: new Date(),
      },
    });

    /**
     * Create a new timeline entry associated with this referral.
     * This helps track actions taken on the referral.
     * 
     * Example message: “Accepted by admin: Needs follow-up call.”
     */
    const timelineMessage = note 
      ? `${dbStatus} by ${role}: ${note}`
      : `Status updated to ${dbStatus} by ${role}`;
      
    await prisma.timeline.create({
      data: {
        referral_id: parseInt(id),
        message: timelineMessage,
      },
    });

    console.log("✅ Referral updated successfully");

    // Return updated referral data in the API response
    return NextResponse.json(updatedReferral, { status: 200 });

  } catch (error) {
    // Log and return a 500 internal server error if something fails
    console.error("Error updating referral status:", error);
    
    return NextResponse.json(
      { 
        message: "Error updating referral status", 
        error: error.message,
      },
      { status: 500 }
    );
  }
}
