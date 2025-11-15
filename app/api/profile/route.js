
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const localUser = await fetchQuery(api.users.getByClerkId, { clerkId: user.id });

    if (!localUser) {
      return NextResponse.json({ error: "User not found in local database" }, { status: 404 });
    }

    return NextResponse.json(localUser);
  } catch (err) {
    console.error("GET /api/profile error:", err);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const localUser = await fetchQuery(api.users.getByClerkId, { clerkId: user.id });

    if (!localUser) {
      return NextResponse.json({ error: "User not found in local database" }, { status: 404 });
    }

    const data = await req.json();

    const updatedUser = await fetchMutation(api.users.update, {
      clerkId: user.id,
      targetClerkId: user.id,
      firstName: data.first_name,
      lastName: data.last_name,
      phoneNumber: data.phone,
      profileImageUrl: data.profile_image_url,
    });

    return NextResponse.json(updatedUser);
  } catch (err) {
    console.error("PUT /api/profile error:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
