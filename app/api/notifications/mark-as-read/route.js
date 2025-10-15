import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const localUser = await prisma.user.findUnique({
      where: { clerk_user_id: user.id },
    });

    if (!localUser) {
      return NextResponse.json({ error: "User not found in local database" }, { status: 404 });
    }

    await prisma.notification.updateMany({
      where: { userId: localUser.id, is_read: false },
      data: { is_read: true },
    });

    return NextResponse.json({ message: "Notifications marked as read" });
  } catch (err) {
    console.error("PATCH /api/notifications/mark-as-read error:", err);
    return NextResponse.json({ error: "Failed to mark notifications as read" }, { status: 500 });
  }
}
