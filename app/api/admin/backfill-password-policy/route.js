// app/api/admin/backfill-password-policy/route.js
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

// Roles that must rotate passwords every 30 days
const TARGET_ROLES = new Set([
  "admin",
  "team_leader",
  // Some legacy data may have team_lead
  "team_lead",
  "support_worker",
  "peer_support",
]);

export async function POST(req) {
  try {
    const me = await currentUser();
    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify superadmin via Convex
    const meDb = await fetchQuery(api.users.getByClerkId, { clerkId: me.id });
    if (!meDb || meDb.roleId !== "superadmin") {
      return NextResponse.json({ error: "Forbidden: SuperAdmin access required" }, { status: 403 });
    }

    const { dryRun = false } = await req.json().catch(() => ({ dryRun: false }));

    // Get all users visible to superadmin
    const allUsers = await fetchQuery(api.users.list, { clerkId: me.id });

    let scanned = 0;
    let eligible = 0;
    let updated = 0;
    const nowIso = new Date().toISOString();

    for (const u of allUsers) {
      scanned += 1;
      if (!u?.clerkId) continue;
      if (!TARGET_ROLES.has(u.roleId || "")) continue;
      eligible += 1;

      // Fetch Clerk user to check existing metadata
      const cuRes = await fetch(`https://api.clerk.com/v1/users/${u.clerkId}`, {
        headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
      });
      if (!cuRes.ok) {
        console.warn(`Failed to fetch Clerk user ${u.clerkId}`);
        continue;
      }
      const cu = await cuRes.json();
      const pm = cu?.public_metadata || {};

      const needsRole = pm.role !== u.roleId;
      const needsPwdAt = !pm.passwordChangedAt;

      if (needsRole || needsPwdAt) {
        const newPm = {
          ...pm,
          role: needsRole ? u.roleId : pm.role,
          passwordChangedAt: needsPwdAt ? nowIso : pm.passwordChangedAt,
        };

        if (!dryRun) {
          const patch = await fetch(`https://api.clerk.com/v1/users/${u.clerkId}`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ public_metadata: newPm }),
          });
          if (!patch.ok) {
            console.warn(`Failed to update Clerk user ${u.clerkId}`);
            continue;
          }
        }
        updated += 1;
      }
    }

    return NextResponse.json({ success: true, dryRun, scanned, eligible, updated });
  } catch (err) {
    console.error("/api/admin/backfill-password-policy error:", err);
    return NextResponse.json({ error: err.message || "Failed backfill" }, { status: 500 });
  }
}
