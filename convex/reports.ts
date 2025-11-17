import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * List all reports with optional filters
 * Returns reports ordered by creation date descending
 */
export const list = query({
  args: {
    orgId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("auditLogs");
    
    // Filter by organization if provided
    if (args.orgId) {
      query = query.withIndex("by_orgId", (q) => q.eq("orgId", args.orgId as any));
    }
    
    // Get reports ordered by timestamp descending
    const reports = await query
      .order("desc")
      .take(args.limit || 100);
    
    // Transform audit logs into report format
    const formattedReports = reports.map(log => ({
      id: log._id,
      report_date: new Date(log.timestamp).toISOString(),
      action: log.action,
      entity_type: log.entityType,
      entity_id: log.entityId,
      user_id: log.userId,
      details: log.details,
      timestamp: log.timestamp,
      orgId: log.orgId,
    }));
    
    return formattedReports;
  },
});

/**
 * Generate a new report entry (for future use)
 */
export const create = mutation({
  args: {
    reportType: v.string(),
    title: v.string(),
    data: v.string(),
    orgId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Create an audit log entry for the report generation
    const reportId = await ctx.db.insert("auditLogs", {
      action: `report_generated_${args.reportType}`,
      entityType: "report",
      details: JSON.stringify({
        title: args.title,
        data: args.data,
      }),
      timestamp: Date.now(),
      orgId: args.orgId as any,
    });
    
    return reportId;
  },
});

// Health summary metrics per user. For now returns deterministic data
// derived from clerkId so charts are stable without historical records.
export const getSummary = query({
  args: { clerkId: v.string() },
  handler: async (_ctx, { clerkId }) => {
    const seed = [...clerkId].reduce((a, c) => a + c.charCodeAt(0), 0);
    const mod = (n: number) => (seed % n) / n;
    return {
      overallProgress: Math.round(70 + mod(30) * 30),
      moodStability: Math.round(75 + mod(27) * 25),
      sleepQuality: Math.round(72 + mod(19) * 20),
      stressLevel: ["Low", "Moderate"][seed % 2],
    };
  },
});

export const getTrends = query({
  args: { clerkId: v.string() },
  handler: async (_ctx, { clerkId }) => {
    const base = [...clerkId].reduce((a, c) => a + c.charCodeAt(0), 0) % 50;
    const weekly = Array.from({ length: 7 }, (_, i) => ({
      day: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i],
      mood: 5 + Math.sin((i + base) * 0.6) * 1.5 + (i/14),
      anxiety: 3 + Math.cos((i + base) * 0.55) * 1.2 - (i/20),
    }));

    const sleep = Array.from({ length: 4 }, (_, w) => ({
      week: `Week ${w + 1}`,
      hours: 5 + ((base + w) % 4),
      quality: 60 + ((base * (w + 1)) % 30),
    }));

    const distribution = [
      { name: "Exercise", value: 25 },
      { name: "Mindfulness", value: 30 },
      { name: "Social", value: 20 },
      { name: "Sleep", value: 25 },
    ];

    const monthly = Array.from({ length: 4 }, (_, i) => ({
      month: ["Jan","Feb","Mar","Apr"][i],
      overall: 70 + i * 5,
      mood: 68 + i * 5,
      sleep: 72 + i * 4,
      stress: 40 - i * 5,
    }));

    return { weekly, sleep, distribution, monthly };
  },
});
