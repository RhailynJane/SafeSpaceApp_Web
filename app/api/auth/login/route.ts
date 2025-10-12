// app/api/auth/login/route.ts
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ authenticated: false }, { status: 200 });

    // Return a minimal user object (do not leak sensitive fields)
    return NextResponse.json({
      authenticated: true,
      id: user.id,
      email: user.emailAddresses?.[0]?.emailAddress ?? null,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      publicMetadata: user.publicMetadata ?? null,
    });
  } catch (err) {
    console.error("auth/login error:", err);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
