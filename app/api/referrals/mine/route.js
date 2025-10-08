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

    const referrals = await prisma.referral.findMany({
      where: { createdByClerkUserId: clerkUserId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ referrals });
  } catch (err) {
    console.error("GET /api/referrals/mine error:", err);
    return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 });
  }
}
