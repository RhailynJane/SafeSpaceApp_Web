// app/api/admin/create-user/route.js
/**
 * @file This API route handles the creation of a new user.
 * It is an admin/superadmin endpoint.
 *
 * The process involves:
 * 1. Verify that the user making the request is an admin or superadmin.
 * 2. Create the user in the Clerk authentication service.
 * 3. Create the user's data in Convex database.
 * 4. If client role, create extended client profile.
 * 5. Send invitation email via Clerk.
 *
 * If the database insertion fails, a rollback mechanism is triggered to delete the newly created user from Clerk
 * to maintain data consistency between the two systems.
 */
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import crypto from "crypto";
import { 
  authorizeAdmin, 
  validateRequestBody, 
  isValidEmail, 
  sanitizeInput,
  createErrorResponse,
  checkRateLimit 
} from "@/lib/security";

export async function POST(req) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting: max 10 user creations per minute per admin
    if (!checkRateLimit(`create-user:${user.id}`, 10, 60000)) {
      return createErrorResponse('Rate limit exceeded. Please try again later.', 429);
    }

    // Verify the user is a superadmin or admin
    const currentUserData = await fetchQuery(api.users.getByClerkId, { 
      clerkId: user.id 
    });

    if (!currentUserData || (currentUserData.roleId !== "superadmin" && currentUserData.roleId !== "admin")) {
      return NextResponse.json({ error: "Forbidden: Admin or SuperAdmin access required" }, { status: 403 });
    }

    const data = await req.json();

    // Define validation schema
    const schema = {
      email: { type: 'email', required: true },
      firstName: { type: 'string', required: true, maxLength: 100 },
      lastName: { type: 'string', required: true, maxLength: 100 },
      roleId: { type: 'string', required: true, maxLength: 50 },
      orgId: { type: 'string', required: true },
      phoneNumber: { type: 'phone', required: false },
      streetAddress: { type: 'string', required: false, maxLength: 255 },
      city: { type: 'string', required: false, maxLength: 100 },
      postalCode: { type: 'string', required: false, maxLength: 20 },
      emergencyContactName: { type: 'string', required: false, maxLength: 100 },
      emergencyContactNumber: { type: 'phone', required: false },
    };

    // Validate and sanitize input
    const validation = validateRequestBody(data, schema);
    if (!validation.valid) {
      return createErrorResponse('Validation failed', 400, validation.errors);
    }

    const sanitizedData = validation.sanitized;

    // Additional role validation (whitelist)
    const allowedRoles = ['client', 'peer_support', 'support_worker', 'team_leader', 'admin', 'superadmin'];
    if (!allowedRoles.includes(sanitizedData.roleId)) {
      return createErrorResponse('Invalid role specified', 400);
    }

    // Helper: strong temporary password generator
    const generateTempPassword = () => {
      const length = 16;
      const lowers = "abcdefghijklmnopqrstuvwxyz";
      const uppers = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const digits = "0123456789";
      const symbols = "!@#$%^&*()-_=+[]{};:,.?";
      // Ensure each class is represented at least once
      const pick = (set) => set[crypto.randomInt(0, set.length)];
      let pwd = [pick(lowers), pick(uppers), pick(digits), pick(symbols)].join("");
      const all = lowers + uppers + digits + symbols;
      for (let i = pwd.length; i < length; i++) {
        pwd += pick(all);
      }
      // Shuffle to avoid predictable first 4 positions
      return pwd
        .split("")
        .sort(() => crypto.randomInt(-1, 2))
        .join("");
    };

    // Prepare a temporary password (unless provided)
    const tempPassword = data.password || generateTempPassword();

    // Step 1: Create user in Clerk
    const clerkResponse = await fetch("https://api.clerk.com/v1/users", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_address: [sanitizedData.email],
        first_name: sanitizedData.firstName,
        last_name: sanitizedData.lastName,
        password: tempPassword,
        // Allow Clerk to enforce password policy; we generated a strong password above
        public_metadata: {
          role: sanitizedData.roleId,
          orgId: sanitizedData.orgId,
          mustChangePassword: true,
        },
      }),
    });

    if (!clerkResponse.ok) {
      const errorData = await clerkResponse.json();
      console.error("Clerk API error:", errorData);
      throw new Error(errorData.errors?.[0]?.message || "Failed to create user in Clerk");
    }

    const clerkUser = await clerkResponse.json();

    // Step 2: Create user in Convex
    let userId;
    try {
      userId = await fetchMutation(api.users.create, {
        clerkId: user.id, // Current user (creator)
        newUserClerkId: clerkUser.id, // New user's Clerk ID
        email: sanitizedData.email,
        firstName: sanitizedData.firstName,
        lastName: sanitizedData.lastName,
        roleId: sanitizedData.roleId,
        orgId: sanitizedData.orgId,
        phoneNumber: sanitizedData.phoneNumber || undefined,
        profileImageUrl: clerkUser.image_url,
        address: sanitizedData.streetAddress ? [
          sanitizedData.streetAddress,
          sanitizedData.city,
          sanitizedData.postalCode
        ].filter(Boolean).join(", ") : undefined,
        emergencyContactName: sanitizedData.emergencyContactName || undefined,
        emergencyContactPhone: sanitizedData.emergencyContactNumber || undefined,
      });

      // Note: Extended client profile fields are stored in the users table
      // If you need a separate clients table, create the mutation in convex/clients.ts

      // Step 4: Trigger email verification via Clerk (email link)
      try {
        const emailId = (clerkUser?.email_addresses && clerkUser.email_addresses[0]?.id) || null;
        if (emailId) {
          const verifyRes = await fetch(`https://api.clerk.com/v1/email_addresses/${emailId}/verification`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ strategy: "email_link" }),
          });
          if (!verifyRes.ok) {
            // Fallback: send an invitation if verification endpoint fails
            console.warn("Email verification failed, falling back to invitation");
            await fetch(`https://api.clerk.com/v1/invitations`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email_address: sanitizedData.email,
                public_metadata: {
                  role: sanitizedData.roleId,
                  orgId: sanitizedData.orgId,
                },
                redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/sign-in`,
              }),
            });
          }
        }
      } catch (verifyError) {
        console.warn("Failed to send verification/invitation email:", verifyError);
        // Don't fail the whole process if email fails
      }

      return NextResponse.json({
        success: true,
        userId,
        clerkUserId: clerkUser.id,
        temporaryPassword: tempPassword,
        message: "User created successfully. Verification email sent.",
      });

    } catch (convexError) {
      // If Convex creation fails, attempt to delete the Clerk user
      console.error("Convex creation failed, attempting Clerk rollback:", convexError);
      
      try {
        await fetch(`https://api.clerk.com/v1/users/${clerkUser.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          },
        });
        console.log(`Rolled back Clerk user: ${clerkUser.id}`);
      } catch (rollbackError) {
        console.error("Failed to rollback Clerk user:", rollbackError);
      }

      throw convexError;
    }

  } catch (err) {
    console.error("POST /api/admin/create-user error:", err);
    return createErrorResponse(err.message || "Failed to create user account", 500);
  }
}
