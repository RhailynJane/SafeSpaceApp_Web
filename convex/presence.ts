import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { isSuperAdmin, hasOrgAccess } from "./auth";

// Record a heartbeat for the current authenticated user
export const heartbeat = mutation({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const userId = identity.subject; // Clerk user id
    const now = Date.now();
    const status = args.status ?? "online";

    // Use get + patch for atomic operation to avoid OCC errors
    const existing = await ctx.db
      .query("presence")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      // Only update if lastSeen is older than 30 seconds to reduce write conflicts
      if (now - existing.lastSeen > 30000) {
        await ctx.db.patch(existing._id, { status, lastSeen: now });
      }
    } else {
      await ctx.db.insert("presence", { userId, status, lastSeen: now });
    }
    return { ok: true, lastSeen: now };
  },
});

// Count online users for an org within a recent window
export const onlineCountByOrg = query({
  args: {
    clerkId: v.string(),
    orgId: v.string(),
    sinceMs: v.optional(v.number()),
  },
  handler: async (ctx, { clerkId, orgId, sinceMs }) => {
    const allowed = (await isSuperAdmin(ctx, clerkId)) || (await hasOrgAccess(ctx, clerkId, orgId));
    if (!allowed) {
      throw new Error("Unauthorized: Cannot access organization presence");
    }

    const cutoff = Date.now() - (sinceMs ?? 6 * 60 * 1000);
    const presence = await ctx.db
      .query("presence")
      .withIndex("by_lastSeen", (q: any) => q.gte("lastSeen", cutoff))
      .collect();

    if (presence.length === 0) return 0;

    // Build a set of clerkIds that are online
    const onlineClerkIds = new Set(presence.map((p: any) => p.userId));

    // Fetch users in this org and count those who are online
    const usersInOrg = await ctx.db
      .query("users")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();

    let count = 0;
    for (const u of usersInOrg) {
      if (u.clerkId && onlineClerkIds.has(u.clerkId)) count++;
    }
    return count;
  },
});
