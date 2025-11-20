import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create a new announcement with images
 */
export const createAnnouncementWithImages = mutation({
  args: {
    orgId: v.string(),
    title: v.string(),
    body: v.string(),
    active: v.boolean(),
    images: v.optional(v.array(v.string())), // Base64 data URLs
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
      active: args.active,
      images: args.images || [],
      authorId: args.authorId,
      visibility: args.visibility,
      priority: args.priority,
      createdAt: now,
      updatedAt: now,
      readBy: [],
    });
    
    // Log audit event
    if (args.authorId) {
      await ctx.db.insert("auditLogs", {
        userId: args.authorId,
        action: "announcement_created",
        entityType: "announcement",
        entityId: announcementId,
        orgId: args.orgId,
        details: JSON.stringify({
          title: args.title,
          orgId: args.orgId,
          active: args.active,
          hasImages: (args.images?.length || 0) > 0,
        }),
        timestamp: now,
      });
    }
    
    return {
      success: true,
      id: announcementId,
    };
  },
});

/**
 * Update an existing announcement
 */
export const updateAnnouncement = mutation({
  args: {
    announcementId: v.id("announcements"),
    title: v.string(),
    body: v.string(),
    active: v.boolean(),
    images: v.optional(v.array(v.string())), // Base64 data URLs
    visibility: v.optional(v.string()),
    priority: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { announcementId, ...updates } = args;
    
    const announcement = await ctx.db.get(announcementId);
    if (!announcement) {
      throw new Error("Announcement not found");
    }
    
    await ctx.db.patch(announcementId, {
      ...updates,
      updatedAt: Date.now(),
    });
    
    // Log audit event
    if (announcement.authorId) {
      await ctx.db.insert("auditLogs", {
        userId: announcement.authorId,
        action: "announcement_updated",
        entityType: "announcement",
        entityId: announcementId,
        orgId: announcement.orgId,
        details: JSON.stringify({
          title: updates.title || announcement.title,
          orgId: announcement.orgId,
          active: updates.active !== undefined ? updates.active : announcement.active,
        }),
        timestamp: Date.now(),
      });
    }
    
    return { success: true };
  },
});

/**
 * Delete an announcement
 */
export const deleteAnnouncement = mutation({
  args: { 
    announcementId: v.id("announcements") 
  },
  handler: async (ctx, args) => {
    const announcement = await ctx.db.get(args.announcementId);
    if (!announcement) {
      throw new Error("Announcement not found");
    }
    
    // Log audit event before deletion
    if (announcement.authorId) {
      await ctx.db.insert("auditLogs", {
        userId: announcement.authorId,
        action: "announcement_deleted",
        entityType: "announcement",
        entityId: args.announcementId,
        orgId: announcement.orgId,
        details: JSON.stringify({
          title: announcement.title,
          orgId: announcement.orgId,
        }),
        timestamp: Date.now(),
      });
    }
    
    await ctx.db.delete(args.announcementId);
    
    return { success: true };
  },
});
