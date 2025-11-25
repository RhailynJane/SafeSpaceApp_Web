import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { resolveUserRole } from "@/lib/security";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

/**
 * POST /api/clients/invite
 * Body: { email: string, firstName?: string, lastName?: string, orgId?: string }
 * Creates a Clerk user for the client (if not exists) and generates a sign-in magic link.
 * User appears immediately in Clerk Users (not just Invitations) and can set password on mobile.
 */
export async function POST(request) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = await resolveUserRole(userId, sessionClaims);
    if (!["superadmin", "admin", "team_leader", "support_worker"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const orgId = String(body?.orgId || body?.org_id || "").trim();
    const firstName = String(body?.firstName || body?.client_first_name || "").trim();
    const lastName = String(body?.lastName || body?.client_last_name || "").trim();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Build publicMetadata so the client is properly classified
    const publicMetadata = {
      role: "client",
      orgId: orgId || undefined,
      invitedBy: userId,
      source: "client-invite",
      mustChangePassword: true,
    };

    // Prefer web landing page for broad compatibility; deep link as fallback
    // Determine redirect base: prefer SITE_URL if it's a proper app domain, otherwise use request origin.
    let siteUrl = process.env.SITE_URL;
    if (!siteUrl || /convex\.cloud/.test(siteUrl)) {
      // Convex deployments don't serve Next.js pages; use runtime origin instead.
      try {
        siteUrl = new URL(request.url).origin;
      } catch {
        siteUrl = undefined;
      }
    }
    const redirectUrl = siteUrl
      ? `${siteUrl.replace(/\/$/, "")}/invite`
      : (process.env.MOBILE_DEEP_LINK_URL || undefined);

    // Validate Clerk secret key exists
    if (!process.env.CLERK_SECRET_KEY) {
      console.error("Invite error: CLERK_SECRET_KEY is not set");
      return NextResponse.json(
        { error: "Server misconfiguration: CLERK_SECRET_KEY missing" },
        { status: 500 }
      );
    }

    // Create or find user in Clerk (immediately creates user, not pending invitation)
    let user;
    let magicLinkUrl;
    const secret = process.env.CLERK_SECRET_KEY;

    try {
      // Step 1: Check if user exists
      const usersRes = await fetch(
        `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`,
        {
          headers: { Authorization: `Bearer ${secret}` },
        }
      );
      const usersData = await usersRes.json();
      
      if (usersData.length > 0) {
        user = usersData[0];
        console.log("User already exists:", user.id);
      } else {
        // Step 2: Create user if not exists
        const createRes = await fetch("https://api.clerk.com/v1/users", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${secret}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email_address: [email],
            first_name: firstName || undefined,
            last_name: lastName || undefined,
            public_metadata: publicMetadata,
            skip_password_checks: true,
            skip_password_requirement: true,
          }),
        });
        const createData = await createRes.json();
        if (!createRes.ok) {
          console.error("Clerk user creation error:", createData);
          throw new Error(
            createData?.errors?.[0]?.message || createData?.error || `User creation failed ${createRes.status}`
          );
        }
        user = createData;
        console.log("Created new user:", user.id);
      }

      // Step 3: Generate magic link sign-in token
      const magicRes = await fetch(
        `https://api.clerk.com/v1/sign_in_tokens`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${secret}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
            expires_in_seconds: 2592000, // 30 days
          }),
        }
      );
      const magicData = await magicRes.json();
      if (!magicRes.ok) {
        console.error("Magic link error:", magicData);
        throw new Error(magicData?.errors?.[0]?.message || "Failed to generate sign-in link");
      }

      // Build sign-in URL that redirects to password setup
      const clerkDomain = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.match(/pk_test_([^$]+)/)?.[1] || "";
      const signInBase = clerkDomain ? `https://${clerkDomain.replace(/-/g, "-")}.clerk.accounts.dev` : siteUrl;
      magicLinkUrl = `${signInBase}/v1/tickets/accept?ticket=${magicData.token}`;
      
      console.log("Magic link generated:", magicLinkUrl);
    } catch (err) {
      console.error("Client user creation/magic link error:", err);
      throw err;
    }

    // Log to Convex audit logs (non-blocking)
    try {
      const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
      if (!convexUrl) {
        console.warn("NEXT_PUBLIC_CONVEX_URL not set; skipping audit log for invite");
      } else {
        const convex = new ConvexHttpClient(convexUrl);
        const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
        const ua = request.headers.get("user-agent") || undefined;
        const details = {
          userId: user.id,
          email,
          orgId,
          name: `${firstName} ${lastName}`.trim(),
          magicLinkUrl,
          invitedBy: userId,
        };
        await convex.mutation(api.auditLogs.log, {
          userId,
          action: "client_invited",
          entityType: "client",
          entityId: email,
          details: JSON.stringify(details),
          ipAddress: ip,
          userAgent: ua,
          orgId: orgId || undefined,
        });
      }
    } catch (logErr) {
      console.warn("Failed to log invitation to Convex:", logErr);
    }

    return NextResponse.json({
      ok: true,
      userId: user.id,
      email,
      orgId,
      name: `${firstName} ${lastName}`.trim(),
      magicLinkUrl,
    });
  } catch (error) {
    console.error("Client invite error:", error);
    return NextResponse.json(
      { error: "Failed to create invitation", detail: error?.message },
      { status: 500 }
    );
  }
}
