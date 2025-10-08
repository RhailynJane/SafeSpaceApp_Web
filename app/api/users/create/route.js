// app/api/users/create/route.js
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Expected JSON body:
 * {
 *   "email": "user@example.com",
 *   "firstName": "First",
 *   "lastName": "Last",
 *   "role": "support_worker" // match your Role enum values
 * }
 *
 * NOTE: This implementation creates the Clerk user with a temporary password.
 * For production: consider `createInvitation` instead (safer UX).
 */
export async function POST(req) {
  try {
    const { sessionClaims } = auth();
    const roleClaim = sessionClaims?.role;
    if (roleClaim !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { email, firstName = "", lastName = "", role } = body;

    if (!email || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create Clerk user
    const clerkUser = await clerkClient.users.createUser({
      emailAddress: [email],
      firstName,
      lastName,
      password: "TempPass123!", // replace with invitation flow in prod
      publicMetadata: { role },
    });

    // Insert into DB via Prisma
    const dbUser = await prisma.user.create({
      data: {
        clerk_user_id: clerkUser.id,
        email,
        first_name: firstName,
        last_name: lastName,
        role: {
          connect: {
            role_name: role,
          },
        },
      },
    });

    return NextResponse.json({ message: "User created", user: dbUser }, { status: 201 });
  } catch (err) {
    console.error("POST /api/users/create error:", err);
    // If Clerk creation failed you might get details in err
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
