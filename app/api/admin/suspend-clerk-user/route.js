// app/api/admin/suspend-clerk-user/route.js
/**
 * Suspend or unsuspend a Clerk user.
 * Body: { targetClerkId: string, action: 'suspend' | 'unsuspend' }
 * SuperAdmin only. Also mirrors the status to Convex users table.
 */
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { createErrorResponse, checkRateLimit } from "@/lib/security";

export async function POST(req) {
  try {
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!checkRateLimit(`suspend-user:${me.id}`, 30, 60_000)) {
      return createErrorResponse("Rate limit exceeded. Please try again later.", 429);
    }

    const meRecord = await fetchQuery(api.users.getByClerkId, { clerkId: me.id });
    if (!meRecord || meRecord.roleId !== "superadmin") {
      return NextResponse.json({ error: "Forbidden: SuperAdmin access required" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const targetClerkId = (body?.targetClerkId || "").trim();
    const action = (body?.action || "").trim();
    if (!targetClerkId || !["suspend", "unsuspend"].includes(action)) {
      return createErrorResponse("'targetClerkId' and valid 'action' are required", 400);
    }

    // Call Clerk REST API: prefer ban/unban which blocks authentication
    const url = `https://api.clerk.com/v1/users/${encodeURIComponent(targetClerkId)}/ban`;
    const res = await fetch(url, {
      method: action === "suspend" ? "POST" : "DELETE",
      headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
    });
    if (!res.ok) {
      let details = null;
      try { details = await res.json(); } catch {}
      const message = details?.errors?.[0]?.message || `Clerk ${action} failed (status ${res.status})`;
      return createErrorResponse(message, 502, details);
    }

    // If suspending, revoke all active sessions for immediate effect (best-effort)
    try {
      if (action === "suspend") {
        await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(targetClerkId)}/sessions/revoke`, {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
        });
      }
    } catch {}

    // Mirror status to Clerk public metadata (best-effort)
    try {
      await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(targetClerkId)}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ public_metadata: { status: action === "suspend" ? "suspended" : "active" } }),
      });
    } catch {}

    // Update Convex user status
    try {
      await fetchMutation(api.users.update, {
        clerkId: me.id,
        targetClerkId,
        status: action === "suspend" ? "suspended" : "active",
      });
    } catch (e) {
      // Not fatal for authentication safety; log for follow-up
      console.warn("Convex status mirror failed:", e);
    }

    return NextResponse.json({ success: true, action });
  } catch (err) {
    console.error("POST /api/admin/suspend-clerk-user error:", err);
    return createErrorResponse(err.message || "Failed to update suspension state", 500);
  }
}
