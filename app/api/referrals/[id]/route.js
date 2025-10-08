import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const { id } = await params; // FIXED: Await params
    const referral = await prisma.referral.findUnique({ where: { id: parseInt(id) } });
    if (!referral) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ referral });
  } catch (err) {
    console.error("GET /api/referrals/[id] error:", err);
    return NextResponse.json({ error: "Failed to fetch referral" }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const { id } = await params; // FIXED: Await params
    const { userId } = await auth();
    const user = await currentUser();
    
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const referral = await prisma.referral.findUnique({ where: { id: parseInt(id) } });
    if (!referral) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const role = user?.publicMetadata?.role;
    const isAdmin = role === "admin";
    const isOwner = referral.createdByClerkUserId === user.id;
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const updated = await prisma.referral.update({
      where: { id: parseInt(id) },
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
    const { id } = await params; // FIXED: Await params
    const { userId } = await auth();
    const user = await currentUser();
    
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const referral = await prisma.referral.findUnique({ where: { id: parseInt(id) } });
    if (!referral) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const role = user?.publicMetadata?.role;
    const isAdmin = role === "admin";
    const isOwner = referral.createdByClerkUserId === user.id;
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.referral.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    console.error("DELETE /api/referrals/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete referral" }, { status: 500 });
  }
}