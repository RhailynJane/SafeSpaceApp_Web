// app/api/referrals/mine/route.js
// (Return referrals for the currently authenticated user.)
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const clerkUserId = user.id;

    // Find the local user record based on the Clerk user ID to get the integer ID
    const localUser = await prisma.user.findUnique({
      where: { clerk_user_id: clerkUserId },
    });

    if (!localUser) {
      return NextResponse.json({ error: "User not found in local database" }, { status: 404 });
    }

    // Fetch referrals assigned to the local user's integer ID
    const referrals = await prisma.referral.findMany({
      where: { processed_by_user_id: localUser.id },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ referrals });
  } catch (err) {
    console.error("GET /api/referrals/mine error:", err);
    return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 });
  }
}
