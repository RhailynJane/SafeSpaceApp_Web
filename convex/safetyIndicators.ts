import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Log a safety indicator when dangerous content is detected
export const logIndicator = mutation({
  args: {
    clientId: v.optional(v.string()),
    source: v.string(), // 'mood_tracking' | 'journaling' | 'community_forum' | 'crisis_access'
    indicatorType: v.string(), // 'severe_distress' | 'self_harm_mention' | 'suicidal_ideation' | 'dangerous_content' | 'crisis_resource_accessed'
    severity: v.string(), // 'low' | 'medium' | 'high' | 'critical'
    description: v.optional(v.string()),
    relatedData: v.optional(v.string()), // JSON
    orgId: v.optional(v.string()),
  },
  handler: async (ctx, args: {
    clientId?: string; source: string; indicatorType: string;
    severity: string; description?: string; relatedData?: string; orgId?: string;
  }) => {
    const now = Date.now();
    const id = await ctx.db.insert("safetyIndicators", {
      clientId: args.clientId,
      source: args.source,
      indicatorType: args.indicatorType,
      severity: args.severity,
      description: args.description,
      relatedData: args.relatedData,
      orgId: args.orgId,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});

// Get safety indicators for a client
export const getClientIndicators = query({
  args: {
    clientId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args: { clientId: string; limit?: number }) => {
    const limit = args.limit ?? 50;
    const indicators = await ctx.db
      .query("safetyIndicators")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .take(limit);

    return indicators.map((ind) => ({
      id: String(ind._id),
      clientId: ind.clientId,
      source: ind.source,
      indicatorType: ind.indicatorType,
      severity: ind.severity,
      description: ind.description,
      relatedData: ind.relatedData,
      reviewedBy: ind.reviewedBy,
      reviewedAt: ind.reviewedAt,
      reviewNotes: ind.reviewNotes,
      actionTaken: ind.actionTaken,
      createdAt: ind.createdAt,
    }));
  },
});

// Get all safety indicators for team leader/admin dashboard
export const getSafetyStats = query({
  args: {
    orgId: v.optional(v.string()),
    daysBack: v.optional(v.number()),
    severity: v.optional(v.string()), // Filter by severity
  },
  handler: async (ctx, args: { orgId?: string; daysBack?: number; severity?: string }) => {
    const daysBack = args.daysBack ?? 30;
    const cutoffTime = Date.now() - daysBack * 24 * 60 * 60 * 1000;

    // Get all indicators in time range
    const allIndicators = await ctx.db.query("safetyIndicators").collect();
    let filtered = allIndicators.filter((ind) => ind.createdAt >= cutoffTime);

    if (args.orgId) {
      filtered = filtered.filter((ind) => ind.orgId === args.orgId);
    }

    if (args.severity) {
      filtered = filtered.filter((ind) => ind.severity === args.severity);
    }

    // Group by severity
    const stats = {
      totalIndicators: filtered.length,
      criticalCount: filtered.filter((ind) => ind.severity === "critical").length,
      highCount: filtered.filter((ind) => ind.severity === "high").length,
      mediumCount: filtered.filter((ind) => ind.severity === "medium").length,
      lowCount: filtered.filter((ind) => ind.severity === "low").length,
      
      // By source
      moodTrackingCount: filtered.filter((ind) => ind.source === "mood_tracking").length,
      journalingCount: filtered.filter((ind) => ind.source === "journaling").length,
      communityForumCount: filtered.filter((ind) => ind.source === "community_forum").length,
      crisisAccessCount: filtered.filter((ind) => ind.source === "crisis_access").length,
      
      // By type
      severeDistressCount: filtered.filter((ind) => ind.indicatorType === "severe_distress").length,
      selfHarmMentionCount: filtered.filter((ind) => ind.indicatorType === "self_harm_mention").length,
      suicidalIdeationCount: filtered.filter((ind) => ind.indicatorType === "suicidal_ideation").length,
      dangerousContentCount: filtered.filter((ind) => ind.indicatorType === "dangerous_content").length,
    };

    return stats;
  },
});

// Get recent safety indicators for dashboard
export const getRecentIndicators = query({
  args: {
    orgId: v.optional(v.string()),
    limit: v.optional(v.number()),
    daysBack: v.optional(v.number()),
  },
  handler: async (ctx, args: { orgId?: string; limit?: number; daysBack?: number }) => {
    const limit = args.limit ?? 20;
    const daysBack = args.daysBack ?? 7;
    const cutoffTime = Date.now() - daysBack * 24 * 60 * 60 * 1000;

    let indicators = await ctx.db.query("safetyIndicators").collect();
    
    indicators = indicators
      .filter((ind) => ind.createdAt >= cutoffTime)
      .filter((ind) => !args.orgId || ind.orgId === args.orgId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);

    return indicators.map((ind) => ({
      id: String(ind._id),
      clientId: ind.clientId,
      source: ind.source,
      indicatorType: ind.indicatorType,
      severity: ind.severity,
      description: ind.description,
      actionTaken: ind.actionTaken,
      createdAt: ind.createdAt,
    }));
  },
});

// Mark indicator as reviewed
export const markAsReviewed = mutation({
  args: {
    indicatorId: v.string(),
    reviewedBy: v.string(), // Clerk ID
    reviewNotes: v.optional(v.string()),
    actionTaken: v.optional(v.string()),
  },
  handler: async (ctx, args: { indicatorId: string; reviewedBy: string; reviewNotes?: string; actionTaken?: string }) => {
    // Note: indicatorId would need to be v.id("safetyIndicators") but we're getting a string
    // In production, convert properly or use a different approach
    const indicators = await ctx.db.query("safetyIndicators").collect();
    const indicator = indicators.find((ind) => String(ind._id) === args.indicatorId);
    
    if (indicator) {
      await ctx.db.patch(indicator._id, {
        reviewedBy: args.reviewedBy,
        reviewedAt: Date.now(),
        reviewNotes: args.reviewNotes,
        actionTaken: args.actionTaken,
        updatedAt: Date.now(),
      });
      return true;
    }
    return false;
  },
});

// Get high-risk clients based on safety indicators
export const getHighRiskClients = query({
  args: {
    orgId: v.optional(v.string()),
    daysBack: v.optional(v.number()),
  },
  handler: async (ctx, args: { orgId?: string; daysBack?: number }) => {
    const daysBack = args.daysBack ?? 30;
    const cutoffTime = Date.now() - daysBack * 24 * 60 * 60 * 1000;

    let indicators = await ctx.db.query("safetyIndicators").collect();
    
    indicators = indicators
      .filter((ind) => ind.createdAt >= cutoffTime)
      .filter((ind) => !args.orgId || ind.orgId === args.orgId)
      .filter((ind) => ind.severity === "critical" || ind.severity === "high");

    // Group by client
    const clientMap = new Map<string, { count: number; latest: number; severities: Set<string>; types: Set<string>; sources: Set<string> }>();
    
    for (const ind of indicators) {
      if (!ind.clientId) continue;
      
      if (!clientMap.has(ind.clientId)) {
        clientMap.set(ind.clientId, { count: 0, latest: 0, severities: new Set(), types: new Set(), sources: new Set() });
      }
      
      const entry = clientMap.get(ind.clientId)!;
      entry.count += 1;
      entry.latest = Math.max(entry.latest, ind.createdAt);
      entry.severities.add(ind.severity);
      entry.types.add(ind.indicatorType);
      entry.sources.add(ind.source);
    }

    return Array.from(clientMap.entries()).map(([clientId, data]) => ({
      clientId,
      indicatorCount: data.count,
      latestIndicatorDate: data.latest,
      severities: Array.from(data.severities),
      types: Array.from(data.types),
      sources: Array.from(data.sources),
    }));
  },
});
