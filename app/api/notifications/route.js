import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();

    // Find local user mapped to Clerk account
    const user = await prisma.user.findUnique({
      where: { clerk_user_id: userId },
    });

    if (!user) {
      console.error("User not found for Clerk ID:", userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch user-specific notifications
    const notifications = await prisma.notification.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
