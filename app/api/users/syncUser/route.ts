import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { clerkId, email, firstName, lastName } = await req.json();

    if (!clerkId) {
      return NextResponse.json({ error: "Missing clerkId" }, { status: 400 });
    }

    const user = await prisma.user.upsert({
      where: { clerk_user_id: clerkId },
      update: { email, first_name: firstName, last_name: lastName },
      create: {
        clerk_user_id: clerkId,
        email,
        first_name: firstName,
        last_name: lastName,
        role: "user", // default if none
      },
    });

    return NextResponse.json({ user });
  } catch (err) {
    console.error("Error in syncUser API:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
