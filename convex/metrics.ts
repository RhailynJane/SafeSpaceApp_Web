import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const upsertMetricsBucket = mutation({
  args: {
    orgId: v.string(),
    minute: v.number(),
    users: v.number(),
    sessions: v.number(),
    dbOk: v.boolean(),
    authOk: v.boolean(),
    apiMs: v.number(),
    alerts: v.number(),
    uptime: v.number(),
  },
  handler: async (ctx, args) => {
    const { orgId, minute } = args;
    const existing = await ctx.db
      .query("metricsBuckets")
      .withIndex("by_org_minute", (q: any) => q.eq("orgId", orgId).eq("minute", minute))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        users: args.users,
        sessions: args.sessions,
        dbOk: args.dbOk,
        authOk: args.authOk,
        apiMs: args.apiMs,
        alerts: args.alerts,
        uptime: args.uptime,
      });
      return { updated: true, id: existing._id };
    }

    const id = await ctx.db.insert("metricsBuckets", {
      ...args,
      createdAt: Date.now(),
    });
    return { inserted: true, id };
  },
});

export const seriesByOrg = query({
  args: {
    orgId: v.string(),
    limit: v.number(),
  },
  handler: async (ctx, { orgId, limit }) => {
    const rows = await ctx.db
      .query("metricsBuckets")
      .withIndex("by_org_minute", (q: any) => q.eq("orgId", orgId))
      .order("desc")
      .take(Math.max(1, Math.min(120, limit)));

    // Return newest->oldest; caller can reverse as needed
    return rows;
  },
});
