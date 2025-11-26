import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * List all reports with optional filters
 * Returns reports ordered by creation date descending
 */
export const list = query({
  args: {
    orgId: v.optional(v.string()),
    reportType: v.optional(v.string()),
    createdBy: v.optional(v.string()),
    start: v.optional(v.number()),
    end: v.optional(v.number()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.id("reports")),
  },
  handler: async (ctx, args) => {
    console.log('[REPORTS LIST] Query args:', args);
    
    // Start with a simple query and apply filters
    let q = ctx.db.query("reports");
    
    // Use org index if orgId provided
    if (args.orgId) {
      q = ctx.db.query("reports").withIndex("by_org", (idx) => idx.eq("orgId", args.orgId as any));
    }
    
    // Get all results first, then filter
    let results = await q.order("desc").take(args.limit || 100);
    
    console.log('[REPORTS LIST] Raw results count:', results.length);
    console.log('[REPORTS LIST] First few results:', results.slice(0, 3).map(r => ({ id: r._id, type: r.reportType, orgId: r.orgId, createdAt: new Date(r.createdAt) })));
    
    // Apply filters in memory
    let filtered = results;
    
    // Filter by date range
    if (args.start != null || args.end != null) {
      const start = args.start ?? 0;
      const end = args.end ?? Number.MAX_SAFE_INTEGER;
      filtered = filtered.filter(r => r.createdAt >= start && r.createdAt <= end);
      console.log('[REPORTS LIST] After date filter:', filtered.length, 'results');
    }
    
    // Filter by report type
    if (args.reportType) {
      filtered = filtered.filter(r => r.reportType === args.reportType);
      console.log('[REPORTS LIST] After type filter:', filtered.length, 'results');
    }
    
    // Filter by creator
    if (args.createdBy) {
      filtered = filtered.filter(r => r.createdBy === args.createdBy);
      console.log('[REPORTS LIST] After creator filter:', filtered.length, 'results');
    }
    
    const mapped = filtered.map((r) => ({
      id: r._id,
      title: r.title,
      reportType: r.reportType,
      sizeBytes: r.sizeBytes,
      createdAt: r.createdAt,
      createdBy: r.createdBy,
      orgId: r.orgId,
      hasFile: !!r.fileStorageId,
      fileMimeType: r.fileMimeType,
      hasChartImage: !!r.chartStorageId,
      chartMimeType: r.chartMimeType,
      dataJson: r.dataJson,
    }));
    console.log('[REPORTS LIST] Returning', mapped.length, 'reports:', mapped.map(r => ({ title: r.title, type: r.reportType, createdAt: new Date(r.createdAt) })));
    return mapped;
  },
});

/**
 * Generate a new report entry (for future use)
 */
export const create = mutation({
  args: {
    reportType: v.string(),
    title: v.string(),
    // Structured metrics snapshot; optional if only file is stored
    dataJson: v.optional(v.any()),
    orgId: v.optional(v.string()),
    createdBy: v.optional(v.string()),
    // File/chart storage via direct upload is not enabled here; persist JSON only
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("reports", {
      title: args.title,
      reportType: args.reportType,
      sizeBytes: undefined,
      createdAt: Date.now(),
      createdBy: args.createdBy as any,
      orgId: args.orgId as any,
      dataJson: args.dataJson,
      fileStorageId: undefined,
      fileMimeType: undefined,
      chartStorageId: undefined,
      chartMimeType: undefined,
    });
    return id;
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
