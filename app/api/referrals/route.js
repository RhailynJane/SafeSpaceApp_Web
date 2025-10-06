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
      where: { status: "pending" },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(referrals);
  } catch (err) {
    console.error("GET /api/referrals error:", err);
    return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    const {
      client_first_name,
      client_last_name,
      age,
      phone,
      address,
      email,
      emergency_contact,
      referral_source,
      priority_level,
      reason_for_referral,
      additional_notes,
    } = body;

    const client_name = `${client_first_name} ${client_last_name}`;

    if (!client_name) return NextResponse.json({ error: "Missing client name" }, { status: 400 });

    const referral = await prisma.referral.create({
      data: {
        client_name,
        age: parseInt(age),
        phone,
        address,
        email,
        emergency_contact,
        referral_source,
        priority_level: priority_level || "Medium",
        reason_for_referral,
        additional_notes,
        submitted_date: new Date(),
        status: "pending",
      },
    });

    return NextResponse.json(referral, { status: 201 });
  } catch (err) {
    console.error("POST /api/referrals error:", err);
    return NextResponse.json({ error: "Failed to create referral" }, { status: 500 });
  }
}
