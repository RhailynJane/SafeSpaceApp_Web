import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { userId, sessionClaims } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerk_user_id: userId },
      include: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userRole = user.role.role_name.replace(/_/g, "-");

    let clients;
    if (userRole === "support-worker") {
      clients = await prisma.client.findMany({
        where: { user_id: user.id },
        orderBy: { created_at: "desc" },
      });
    } else {
      clients = await prisma.client.findMany({
        orderBy: { created_at: "desc" },
      });
    }

    return NextResponse.json(clients, { status: 200 });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { message: "Error fetching clients", error: error.message },
      { status: 500 }
    );
  }
}