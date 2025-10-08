import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req, { params }) {
  try {
    const { id } = params;
    
    const body = await req.json();
    const { status, note } = body;
    
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const role = user?.publicMetadata?.role;
    
    const allowedRoles = ["admin", "team_leader"];

    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ 
        error: "Forbidden - Team Leader or Admin access required",
        yourRole: role 
      }, { status: 403 });
    }

    // Map frontend status to database status
    const statusMap = {
      "accepted": "Accepted",
      "declined": "Declined",
      "more-info-requested": "More Info Requested"
    };

    const dbStatus = statusMap[status] || status;

    console.log("Updating referral:", { id, status, dbStatus, note });

    // Update referral
    const updatedReferral = await prisma.referral.update({
      where: { id: parseInt(id) },
      data: {
        status: dbStatus,
        processed_date: new Date(),
      },
    });

    // Create timeline event using connect
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

    return NextResponse.json(updatedReferral, { status: 200 });
  } catch (error) {
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