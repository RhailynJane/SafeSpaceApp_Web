import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserOrganization } from "./auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) throw new Error("Unauthenticated");

      // Get user's organization to filter alerts
      const org = await getUserOrganization(ctx, identity.subject);

      // Fetch system alerts filtered by organization or global alerts (orgId: undefined)
      let alerts;
      if (org) {
        // Get alerts for this organization
        const orgAlerts = await ctx.db
          .query("systemAlerts")
          .withIndex("by_orgId", (q) => q.eq("orgId", org.slug))
          .order("desc")
          .collect();
        
        // Get global alerts (filter where orgId is undefined/null)
        const allAlerts = await ctx.db
          .query("systemAlerts")
          .order("desc")
          .collect();
        
        const globalAlerts = allAlerts.filter(alert => !alert.orgId);
        
        // Combine and sort by createdAt
        alerts = [...orgAlerts, ...globalAlerts].sort((a, b) => b.createdAt - a.createdAt);
      } else {
        // If no org, show all alerts
        alerts = await ctx.db
          .query("systemAlerts")
          .order("desc")
          .collect();
      }

      // Format for frontend compatibility
      return alerts.map((alert) => ({
        id: alert._id,
        type: alert.type,
        message: alert.message,
        timestamp: alert.createdAt,
        severity: alert.severity,
        isRead: alert.isRead,
      }));
    } catch (error) {
      console.error("Error in systemAlerts.list:", error);
      // Return empty array instead of throwing to prevent 500 errors
      return [];
    }
  },
});

export const create = mutation({
  args: {
    message: v.string(),
    type: v.string(),
    severity: v.optional(v.string()),
    orgId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const alertId = await ctx.db.insert("systemAlerts", {
      message: args.message,
      type: args.type,
      severity: args.severity,
      isRead: false,
      orgId: args.orgId,
      createdAt: Date.now(),
    });

    return { _id: alertId };
  },
});
