import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { clerkId, email, firstName, lastName, publicMetadata } = await req.json() as any;

    if (!clerkId) {
      return NextResponse.json({ error: "Missing clerkId" }, { status: 400 });
    }

    const roleName = publicMetadata?.role || "user";
    const role = await prisma.role.findUnique({
        where: { role_name: roleName },
    });

    if (!role) {
        return NextResponse.json({ error: `Role '${roleName}' not found.` }, { status: 400 });
    }

    const user = await prisma.user.upsert({
      where: { clerk_user_id: clerkId },
      update: { email, first_name: firstName, last_name: lastName },
      create: {
        clerk_user_id: clerkId,
        email,
        first_name: firstName,
        last_name: lastName,
        role_id: role.id,
      },
    });

    // Also create/update the user in Sendbird
    const sendbirdResponse = await fetch(
      `https://api-${process.env.SENDBIRD_APP_ID}.sendbird.com/v3/users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Api-Token": process.env.SENDBIRD_API_TOKEN,
        },
        body: JSON.stringify({
          user_id: clerkId,
          nickname: `${firstName} ${lastName}`,
          profile_url: "", // You can add a profile image URL here if available
        }),
      }
    );

    if (!sendbirdResponse.ok) {
      const errorData = await sendbirdResponse.json();
      console.error("Sendbird user creation failed:", errorData);
      // For now, we'll just log it and not block the user creation in our DB
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error("Error in syncUser API:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
