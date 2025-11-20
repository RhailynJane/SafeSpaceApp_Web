import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * List announcements by organization
 */
export const listByOrg = query({
  args: {
    orgId: v.string(),
    activeOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { orgId, activeOnly = false, limit = 50 } = args;
    
    const announcements = await ctx.db
      .query("announcements")
      .withIndex("by_org_created", (q) => q.eq("orgId", orgId))
      .order("desc")
      .take(limit);
    
    if (activeOnly) {
      return {
        announcements: announcements.filter(a => a.active),
      };
    }
    
    return {
      announcements,
    };
  },
});

/**
 * List active announcements for a specific organization
 */
export const listActive = query({
  args: {
    orgId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { orgId, limit = 50 } = args;
    
    const announcements = await ctx.db
      .query("announcements")
      .withIndex("by_org_active", (q) => q.eq("orgId", orgId).eq("active", true))
      .order("desc")
      .take(limit);
    
    return announcements;
  },
});

/**
 * Get a single announcement by ID
 */
export const getById = query({
  args: { id: v.id("announcements") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Create a new announcement
 */
export const create = mutation({
  args: {
    orgId: v.string(),
    title: v.string(),
    body: v.string(),
    active: v.optional(v.boolean()),
    authorId: v.optional(v.string()),
    visibility: v.optional(v.string()),
    priority: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const announcementId = await ctx.db.insert("announcements", {
      orgId: args.orgId,
      title: args.title,
      body: args.body,
      active: args.active ?? true,
      authorId: args.authorId,
      visibility: args.visibility,
      priority: args.priority,
      createdAt: now,
      updatedAt: now,
      readBy: [],
    });
    
    // Audit log
    await ctx.db.insert("auditLogs", {
      userId: args.authorId,
      action: "announcement_created",
      entityType: "announcement",
      entityId: announcementId,
      details: JSON.stringify({ 
        title: args.title, 
        orgId: args.orgId, 
        visibility: args.visibility,
        priority: args.priority 
      }),
      orgId: args.orgId,
      timestamp: now,
    });
    
    return announcementId;
  },
});

/**
 * Update an existing announcement
 */
export const update = mutation({
  args: {
    id: v.id("announcements"),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    active: v.optional(v.boolean()),
    visibility: v.optional(v.string()),
    priority: v.optional(v.string()),
    authorId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, authorId, ...updates } = args;
    
    const announcement = await ctx.db.get(id);
    if (!announcement) {
      throw new Error("Announcement not found");
    }
    
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    
    // Audit log
    await ctx.db.insert("auditLogs", {
      userId: authorId,
      action: "announcement_updated",
      entityType: "announcement",
      entityId: id,
      details: JSON.stringify({ 
        title: updates.title ?? announcement.title,
        changes: Object.keys(updates)
      }),
      orgId: announcement.orgId,
      timestamp: Date.now(),
    });
    
    return { success: true };
  },
});

/**
 * Delete an announcement
 */
export const remove = mutation({
  args: { 
    id: v.id("announcements"),
    authorId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const announcement = await ctx.db.get(args.id);
    if (!announcement) {
      throw new Error("Announcement not found");
    }
    
    await ctx.db.delete(args.id);
    
    // Audit log
    await ctx.db.insert("auditLogs", {
      userId: args.authorId,
      action: "announcement_deleted",
      entityType: "announcement",
      entityId: args.id,
      details: JSON.stringify({ 
        title: announcement.title,
        orgId: announcement.orgId 
      }),
      orgId: announcement.orgId,
      timestamp: Date.now(),
    });
    return { success: true };
  },
});

/**
 * Mark announcement as read by a user
 */
export const markAsRead = mutation({
  args: {
    id: v.id("announcements"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const announcement = await ctx.db.get(args.id);
    if (!announcement) {
      throw new Error("Announcement not found");
    }
    
    const readBy = announcement.readBy || [];
    if (!readBy.includes(args.userId)) {
      await ctx.db.patch(args.id, {
        readBy: [...readBy, args.userId],
      });
    }
    
    return { success: true };
  },
});

/**
 * Get unread count for a user
 */
export const getUnreadCount = query({
  args: {
    orgId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const announcements = await ctx.db
      .query("announcements")
      .withIndex("by_org_active", (q) => 
        q.eq("orgId", args.orgId).eq("active", true)
      )
      .collect();
    
    const unreadCount = announcements.filter(
      (a) => !(a.readBy || []).includes(args.userId)
    ).length;
    
    return unreadCount;
  },
});
