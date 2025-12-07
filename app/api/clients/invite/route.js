import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { resolveUserRole } from "@/lib/security";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

/**
 * POST /api/clients/invite
 * Body: { email: string, firstName?: string, lastName?: string, orgId?: string }
 * Behavior:
 * - Existing Clerk user: updates metadata and sends Clerk password reset email
 * - New user: creates Clerk invitation (Clerk emails invite)
 */
export async function POST(request) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = await resolveUserRole(userId, sessionClaims);
    if (!["superadmin", "admin", "team_leader", "support_worker"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const orgId = String(body?.orgId || body?.org_id || "").trim();
    const firstName = String(body?.firstName || body?.client_first_name || "").trim();
    const lastName = String(body?.lastName || body?.client_last_name || "").trim();
    
    console.log("Invite request body:", { email, orgId, firstName, lastName });
    
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const publicMetadata = {
      role: "client",
      orgId: orgId || undefined,
      invitedBy: userId,
      source: "client-invite",
      mustChangePassword: true,
    };

    let siteUrl = process.env.SITE_URL;
    if (!siteUrl) {
      try {
        siteUrl = new URL(request.url).origin;
      } catch {
        siteUrl = process.env.NEXT_PUBLIC_CONVEX_URL || undefined;
      }
    }
    const redirectUrl = siteUrl ? `${siteUrl.replace(/\/$/, "")}/invite` : (process.env.MOBILE_DEEP_LINK_URL || undefined);

    const secret = process.env.CLERK_SECRET_KEY;
    if (!secret) {
      console.error("Invite error: CLERK_SECRET_KEY is not set");
      return NextResponse.json({ error: "Server misconfiguration: CLERK_SECRET_KEY missing" }, { status: 500 });
    }

    let user;
    let magicLinkUrl;

    // Find existing user
    let usersData;
    try {
      const usersRes = await fetch(`https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`,
        { headers: { Authorization: `Bearer ${secret}` } });
      if (!usersRes.ok) {
        const usersErr = await usersRes.json().catch(() => ({}));
        console.error("Clerk users lookup failed:", usersErr);
        return NextResponse.json({ error: usersErr?.errors?.[0]?.message || "Failed to lookup user" }, { status: usersRes.status });
      }
      usersData = await usersRes.json();
    } catch (e) {
      console.error("Clerk users lookup error:", e);
      return NextResponse.json({ error: "User lookup error" }, { status: 500 });
    }

    if (Array.isArray(usersData) && usersData.length > 0) {
      // User exists - update metadata and send sign-in token (magic link for password setup)
      user = usersData[0];
      console.log(`Existing user found: ${user.id} (${email})`);
      
      // Update metadata to enforce password change
      try {
        const upd = await fetch(`https://api.clerk.com/v1/users/${user.id}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            public_metadata: {
              ...(user.public_metadata || {}),
              role: (user.public_metadata?.role ?? "client"),
              orgId: orgId || (user.public_metadata?.orgId),
              mustChangePassword: true,
            },
          }),
        });
        if (!upd.ok) {
          const updErr = await upd.json().catch(() => ({}));
          console.warn("Failed to update user metadata:", updErr);
        } else {
          console.log("Metadata updated successfully");
        }
      } catch (e) {
        console.warn("Error updating user metadata:", e);
      }

      // No need to generate magic links - users will use forgot password flow
      magicLinkUrl = undefined;
      console.log("Setup instructions will be sent via email");

      // Send email via Brevo with instructions
      try {
        const brevoKey = process.env.AUTH_BREVO_KEY;
        if (!brevoKey) {
          console.warn("AUTH_BREVO_KEY not set, skipping email");
        } else {
          const emailRes = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
              "api-key": brevoKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sender: { email: "safespace.dev.app@gmail.com", name: "SafeSpace" },
              to: [{ email }],
              subject: "Complete Your SafeSpace Account Setup",
              htmlContent: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>Welcome to SafeSpace!</h2>
                  <p>Hi ${firstName || "there"},</p>
                  <p>You've been invited to join SafeSpace. To set up your password:</p>
                  <ol style="line-height: 1.8;">
                    <li>Open the SafeSpace app</li>
                    <li>Tap "Forgot Password?" on the login screen</li>
                    <li>Enter your email: <strong>${email}</strong></li>
                    <li>Follow the instructions to create your password</li>
                  </ol>
                  <p style="color: #666; font-size: 14px; margin-top: 20px;">If you have any questions, please contact your administrator.</p>
                </div>
              `,
            }),
          });
          
          if (emailRes.ok) {
            console.log("Password setup email sent via Brevo");
          } else {
            const emailErr = await emailRes.json().catch(() => ({}));
            console.warn("Brevo email failed:", emailErr);
          }
        }
      } catch (emailErr) {
        console.warn("Error sending email:", emailErr);
      }
    } else {
      // New user - create them first, then send invitation
      console.log(`Creating new user for ${email}`);
      const createBody = {
        email_address: email,
      };
      if (firstName) createBody.first_name = firstName;
      if (lastName) createBody.last_name = lastName;
      createBody.public_metadata = publicMetadata;
      
      console.log("Clerk user creation body:", createBody);
      
      const createRes = await fetch("https://api.clerk.com/v1/users", {
        method: "POST",
        headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
        body: JSON.stringify(createBody),
      });
      const createData = await createRes.json();
      if (!createRes.ok) {
        console.error("Clerk user creation error:", createRes.status, createData);
        return NextResponse.json({ 
          error: createData?.errors?.[0]?.message || "User creation failed",
          detail: JSON.stringify(createData)
        }, { status: createRes.status || 500 });
      }
      user = createData;
      console.log("New user created:", user.id);

      // No need to generate magic links - users will use forgot password flow
      magicLinkUrl = undefined;

      // Send welcome email via Brevo
      try {
        const brevoKey = process.env.AUTH_BREVO_KEY;
        if (brevoKey) {
          const emailRes = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
              "api-key": brevoKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sender: { email: "safespace.dev.app@gmail.com", name: "SafeSpace" },
              to: [{ email }],
              subject: "Welcome to SafeSpace - Set Up Your Password",
              htmlContent: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>Welcome to SafeSpace!</h2>
                  <p>Hi ${firstName || "there"},</p>
                  <p>Your SafeSpace account has been created. To set up your password:</p>
                  <ol style="line-height: 1.8;">
                    <li>Open the SafeSpace app</li>
                    <li>Tap "Forgot Password?" on the login screen</li>
                    <li>Enter your email: <strong>${email}</strong></li>
                    <li>You'll receive a verification code via email</li>
                    <li>Enter the code and create your password</li>
                  </ol>
                  <p style="color: #666; font-size: 14px; margin-top: 20px;">Welcome to the SafeSpace community!</p>
                </div>
              `,
            }),
          });
          
          if (emailRes.ok) {
            console.log("Welcome email sent via Brevo");
          } else {
            console.warn("Brevo email failed");
          }
        }
      } catch (emailErr) {
        console.warn("Error sending email:", emailErr);
      }
    }

    // Audit log (best-effort)
    try {
      const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
      if (convexUrl) {
        const convex = new ConvexHttpClient(convexUrl);
        const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
        const ua = request.headers.get("user-agent") || undefined;
        const details = { userId: user?.id, email, orgId, name: `${firstName} ${lastName}`.trim(), magicLinkUrl, invitedBy: userId };
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

    return NextResponse.json({ ok: true, userId: user?.id, email, orgId, name: `${firstName} ${lastName}`.trim(), magicLinkUrl });
  } catch (error) {
    console.error("Client invite error:", error);
    return NextResponse.json({ error: "Failed to create invitation", detail: error?.message }, { status: 500 });
  }
}
