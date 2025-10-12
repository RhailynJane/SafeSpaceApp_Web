// app/api/referrals/[id]/route.js
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const { id } = params;
    const referral = await prisma.referral.findUnique({ where: { id: Number(id) } });
    if (!referral) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ referral });
  } catch (err) {
    console.error("GET /api/referrals/[id] error:", err);
    return NextResponse.json({ error: "Failed to fetch referral" }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const { id } = params;
    const { sessionClaims } = auth();
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const referral = await prisma.referral.findUnique({ where: { id: Number(id) } });
    if (!referral) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // allow update if admin or owner
    const isAdmin = sessionClaims?.metadata?.role === "admin";
    const isOwner = referral.createdByClerkUserId === user.id;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const updated = await prisma.referral.update({
      where: { id: Number(id) },
      data: body,
    });

    return NextResponse.json({ referral: updated });
  } catch (err) {
    console.error("PATCH /api/referrals/[id] error:", err);
    return NextResponse.json({ error: "Failed to update referral" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    const { sessionClaims } = auth();
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const referral = await prisma.referral.findUnique({ where: { id: Number(id) } });
    if (!referral) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isAdmin = sessionClaims?.metadata?.role === "admin";
    const isOwner = referral.createdByClerkUserId === user.id;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.referral.delete({ where: { id: Number(id) } });
    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    console.error("DELETE /api/referrals/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete referral" }, { status: 500 });
  }
}
