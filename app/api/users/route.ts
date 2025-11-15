// app/api/users/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { sessionClaims } = await auth();
    const role = (sessionClaims as any)?.metadata?.role;

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: { id: "asc" },
    });

    return NextResponse.json({ users });
  } catch (err) {
    console.error("GET /api/users error:", err);
    return NextResponse.json({ error: "Failed to get users" }, { status: 500 });
  }
}
