import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Create an announcement with optional pre-compressed image data URLs.
export const createAnnouncementWithImages = mutation({
  args: {
    orgId: v.string(),
    title: v.string(),
    body: v.string(),
    active: v.optional(v.boolean()),
    images: v.optional(v.array(v.string())),
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
      images: args.images ?? [],
      authorId: args.authorId,
      visibility: args.visibility,
      priority: args.priority,
      createdAt: now,
      updatedAt: now,
      readBy: [],
    });

    await ctx.db.insert("auditLogs", {
      userId: args.authorId,
      action: "announcement_created",
      entityType: "announcement",
      entityId: announcementId,
      details: JSON.stringify({
        title: args.title,
        orgId: args.orgId,
        visibility: args.visibility,
        priority: args.priority,
        hasImages: (args.images?.length ?? 0) > 0,
      }),
      orgId: args.orgId,
      timestamp: now,
    });

    return { announcementId };
  },
});

export const markAsRead = mutation({
  args: { announcementId: v.id("announcements") },
  handler: async (ctx, { announcementId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const announcement = await ctx.db.get(announcementId);
    if (!announcement) throw new Error("Announcement not found");

    const readBy = announcement.readBy ?? [];
    if (!readBy.includes(identity.subject)) {
      await ctx.db.patch(announcementId, {
        readBy: [...readBy, identity.subject],
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});
