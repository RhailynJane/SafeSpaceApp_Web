import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Security: Input validation
function sanitizeString(input: string | undefined, maxLength = 500): string {
  if (!input) return "";
  return input.replace(/[<>"'`]/g, "").trim().slice(0, maxLength);
}

function validateAction(action: string): void {
  if (!action || typeof action !== 'string') {
    throw new Error("Action is required");
  }
  if (action.length > 100) {
    throw new Error("Action name too long");
  }
}

function validateEntityType(entityType: string | undefined): void {
  if (!entityType) return;
  const validTypes = ["user", "organization", "client", "referral", "appointment", "note", "crisis", "feature_permission"];
  if (!validTypes.includes(entityType)) {
    // Allow it but log it as other
    console.warn(`Unknown entity type: ${entityType}`);
  }
}

/**
 * List audit logs with optional filters
 * Returns all audit logs from all orgs and users
 */
export const list = query({
  args: {
    userId: v.optional(v.string()),
    orgId: v.optional(v.id("organizations")),
    action: v.optional(v.string()),
    entityType: v.optional(v.string()),
    limit: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let logs = await ctx.db.query("auditLogs").order("desc").collect();

    // Apply filters
    if (args.userId) {
      logs = logs.filter((log) => log.userId === args.userId);
    }
    if (args.orgId) {
      logs = logs.filter((log) => log.orgId === args.orgId);
    }
    if (args.action && args.action !== "all") {
      logs = logs.filter((log) => log.action === args.action);
    }
    if (args.entityType && args.entityType !== "all") {
      logs = logs.filter((log) => log.entityType === args.entityType);
    }
    if (args.startDate) {
      logs = logs.filter((log) => log.timestamp >= args.startDate);
    }
    if (args.endDate) {
      logs = logs.filter((log) => log.timestamp <= args.endDate);
    }

    // Apply limit
    const limit = args.limit || 50;
    logs = logs.slice(0, limit);

    // Enrich with user and org names
    const enrichedLogs = await Promise.all(
      logs.map(async (log) => {
        let userName = "System";
        let userEmail = null;
        let orgName = null;

        if (log.userId) {
          const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", log.userId))
            .first();
          if (user) {
            userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "Unknown User";
            userEmail = user.email;
          }
        }

        if (log.orgId) {
          const org = await ctx.db.get(log.orgId as any);
          if (org && "name" in org) {
            orgName = org.name;
          }
        }

        return {
          ...log,
          userName,
          userEmail,
          orgName,
        };
      })
    );

    return enrichedLogs;
  },
});

/**
 * Get audit logs for a specific user
 */
export const getByUser = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 50);

    return logs;
  },
});

/**
 * Get audit logs for a specific organization
 */
export const getByOrg = query({
  args: {
    orgId: v.id("organizations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .order("desc")
      .take(args.limit || 50);

    return logs;
  },
});

/**
 * Get recent audit logs
 */
export const getRecent = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("auditLogs")
      .order("desc")
      .take(args.limit || 20);

    // Enrich with user names
    const enrichedLogs = await Promise.all(
      logs.map(async (log) => {
        let userName = "System";
        if (log.userId) {
          const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", log.userId))
            .first();
          if (user) {
            userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "Unknown User";
          }
        }
        return {
          ...log,
          userName,
        };
      })
    );

    return enrichedLogs;
  },
});

/**
 * Get audit log statistics
 */
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const allLogs = await ctx.db.query("auditLogs").collect();

    // Count by action type
    const byAction = allLogs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Count by entity type
    const byEntityType = allLogs.reduce((acc, log) => {
      if (log.entityType) {
        acc[log.entityType] = (acc[log.entityType] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Count by organization
    const byOrg = allLogs.reduce((acc, log) => {
      if (log.orgId) {
        acc[log.orgId] = (acc[log.orgId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Get last 24 hours count
    const last24Hours = allLogs.filter(
      (log) => log.timestamp >= Date.now() - 24 * 60 * 60 * 1000
    ).length;

    // Get last 7 days count
    const last7Days = allLogs.filter(
      (log) => log.timestamp >= Date.now() - 7 * 24 * 60 * 60 * 1000
    ).length;

    return {
      total: allLogs.length,
      last24Hours,
      last7Days,
      byAction,
      byEntityType,
      byOrg,
    };
  },
});

/**
 * Create an audit log entry
 * This mutation is used throughout the app to track user actions
 */
export const log = mutation({
  args: {
    userId: v.optional(v.string()),
    action: v.string(),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    details: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    orgId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    // Validate inputs
    validateAction(args.action);
    validateEntityType(args.entityType);

    // Sanitize inputs (limit sizes to prevent DoS)
    const sanitizedAction = sanitizeString(args.action, 100);
    const sanitizedEntityType = sanitizeString(args.entityType, 50);
    const sanitizedEntityId = sanitizeString(args.entityId, 100);
    const sanitizedDetails = sanitizeString(args.details, 2000); // Allow larger details
    const sanitizedIp = sanitizeString(args.ipAddress, 45); // IPv6 max length
    const sanitizedUserAgent = sanitizeString(args.userAgent, 500);

    const logId = await ctx.db.insert("auditLogs", {
      userId: args.userId,
      action: sanitizedAction,
      entityType: sanitizedEntityType || undefined,
      entityId: sanitizedEntityId || undefined,
      details: sanitizedDetails || undefined,
      ipAddress: sanitizedIp || undefined,
      userAgent: sanitizedUserAgent || undefined,
      orgId: args.orgId,
      timestamp: Date.now(),
    });

    return logId;
  },
});
