import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const localUser = await prisma.user.findUnique({
      where: { clerk_user_id: user.id },
    });

    if (!localUser) {
      return NextResponse.json({ error: "User not found in local database" }, { status: 404 });
    }

    console.log("localUser:", localUser);

    const notifications = await prisma.notification.findMany({
      where: { user_id: localUser.id, is_read: false },
      orderBy: { created_at: "desc" },
    });

    console.log("notifications:", notifications);

    return NextResponse.json({ notifications });
  } catch (err) {
    console.error("GET /api/notifications/mine error:", err);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}
