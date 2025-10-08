import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get fresh user data from Clerk
    const user = await currentUser();
    const role = user?.publicMetadata?.role;

    console.log("API Auth check:", { userId, role });
    console.log("Full publicMetadata:", user?.publicMetadata);

    const allowedRoles = ["admin", "team_leader"];
    if (!allowedRoles.includes(role)) {
      console.log("Access denied. Expected: admin or team_leader, Got:", role);
      return NextResponse.json({ 
        error: "Forbidden - Team Leader or Admin access required",
        yourRole: role,
        publicMetadata: user?.publicMetadata
      }, { status: 403 });
    }

    console.log("✅ Access granted for role:", role);

    const referrals = await prisma.referral.findMany({
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(referrals, { status: 200 });
  } catch (error) {
    console.error("Error fetching referrals:", error);
    return NextResponse.json(
      { message: "Error fetching referrals", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get fresh user data from Clerk
    const user = await currentUser();
    const role = user?.publicMetadata?.role;

    // Only admin can create referrals
    if (role !== "admin") {
      return NextResponse.json({ 
        error: "Forbidden - Admin access required",
        yourRole: role 
      }, { status: 403 });
    }

    const data = await req.json();

    const referral = await prisma.referral.create({
      data: {
        client_first_name: data.client_first_name,
        client_last_name: data.client_last_name,
        age: data.age ? parseInt(data.age) : null,
        phone: data.phone,
        address: data.address,
        email: data.email,
        emergency_first_name: data.emergency_first_name,
        emergency_last_name: data.emergency_last_name,
        emergency_phone: data.emergency_phone,
        referral_source: data.referral_source || "Unknown",
        reason_for_referral: data.reason_for_referral || "",
        additional_notes: data.additional_notes || "",
        submitted_date: new Date(),
        status: "Pending",
      },
    });

    return NextResponse.json(referral, { status: 201 });
  } catch (error) {
    console.error("Error creating referral:", error);
    return NextResponse.json(
      { message: "Error creating referral", error: error.message },
      { status: 500 }
    );
  }
}