// app/api/referrals/route.js
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { sessionClaims } = auth();
    const role = sessionClaims?.metadata?.role;
    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // NOTE: Requires a `Referral` model in Prisma schema
    const referrals = await prisma.referral.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ referrals });
  } catch (err) {
    console.error("GET /api/referrals error:", err);
    return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { sessionClaims, userId } = auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    // Example body fields: { clientName, notes, referredById (clerkUserId) }
    const { clientName, notes } = body;

    if (!clientName) return NextResponse.json({ error: "Missing clientName" }, { status: 400 });

    // Create referral associated with the current user
    const referral = await prisma.referral.create({
      data: {
        clientName,
        notes,
        createdByClerkUserId: userId,
      },
    });

    return NextResponse.json({ referral }, { status: 201 });
  } catch (err) {
    console.error("POST /api/referrals error:", err);
    return NextResponse.json({ error: "Failed to create referral" }, { status: 500 });
  }
}
