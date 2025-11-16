// app/api/admin/delete-clerk-user/route.js
/**
 * Deletes a user from Clerk by Clerk user ID.
 * SuperAdmin only. Use this before removing the user from Convex to prevent
 * orphaned login capability.
 */
import { NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { createErrorResponse, checkRateLimit } from "@/lib/security";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(req) {
  try {
    const me = await currentUser();
    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit per admin to avoid accidental mass deletes
    if (!checkRateLimit(`delete-clerk-user:${me.id}`, 20, 60_000)) {
      return createErrorResponse("Rate limit exceeded. Please try again later.", 429);
    }

    // Only SuperAdmins can delete accounts
    const meRecord = await fetchQuery(api.users.getByClerkId, { clerkId: me.id });
    if (!meRecord || meRecord.roleId !== "superadmin") {
      return NextResponse.json({ error: "Forbidden: SuperAdmin access required" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const targetClerkId = (body?.targetClerkId || "").trim();
    if (!targetClerkId) {
      return createErrorResponse("'targetClerkId' is required", 400);
    }

    // Prevent deleting the last SuperAdmin
    const targetRecord = await fetchQuery(api.users.getByClerkId, { clerkId: me.id, targetClerkId });
    // If the user record is missing from Convex, still allow Clerk deletion.
    if (targetRecord?.roleId === "superadmin") {
      const superadmins = await fetchQuery(api.users.list, { clerkId: me.id, roleId: "superadmin" });
      if ((superadmins || []).length <= 1) {
        return createErrorResponse("Cannot delete the last SuperAdmin user", 400);
      }
    }

    // Call Clerk REST API to delete the user
    const res = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(targetClerkId)}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    });

    if (!res.ok) {
      let details = null;
      try { details = await res.json(); } catch {}
      const message = details?.errors?.[0]?.message || `Clerk deletion failed (status ${res.status})`;
      return createErrorResponse(message, 502, details);
    }

    // Clerk returns 200 or 204; consider it a success
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/admin/delete-clerk-user error:", err);
    return createErrorResponse(err.message || "Failed to delete Clerk user", 500);
  }
}
