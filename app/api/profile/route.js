
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

    const localUser = await prisma.user.findUnique({
      where: { clerk_user_id: user.id },
    });

    if (!localUser) {
      return NextResponse.json({ error: "User not found in local database" }, { status: 404 });
    }

    const data = await req.json();

    const updatedUser = await prisma.user.update({
      where: { id: localUser.id },
      data: {
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        profile_image_url: data.profile_image_url,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (err) {
    console.error("PUT /api/profile error:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
