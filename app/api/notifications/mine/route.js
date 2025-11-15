import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const localUser = await fetchQuery(api.users.getByClerkId, { clerkId: user.id });

    if (!localUser) {
      return NextResponse.json({ error: "User not found in local database" }, { status: 404 });
    }

    console.log("localUser:", localUser);

    // For now, return empty array until notifications table is populated
    const notifications = [];

    console.log("notifications:", notifications);

    return NextResponse.json({ notifications });
  } catch (err) {
    console.error("GET /api/notifications/mine error:", err);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}
