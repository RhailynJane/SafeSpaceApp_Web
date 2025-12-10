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
/**
 * Mark announcement as read (mobile and web support)
 */
export const markAsRead = mutation({
  args: {
    announcementId: v.optional(v.string()),
    id: v.optional(v.string()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Support both announcementId and id parameter names
    const announcementId = (args as any).announcementId || (args as any).id;
    if (!announcementId) {
      throw new Error("announcementId or id is required");
    }

    const id = announcementId as any;

    const announcement = await ctx.db.get(id);
    if (!announcement) {
      throw new Error("Announcement not found");
    }

    // Support both explicit userId and auth identity
    let userId = (args as any).userId;
    if (!userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) throw new Error("Unauthenticated");
      userId = identity.subject;
    }

    const readBy = (announcement as any).readBy || [];
    if (!readBy.includes(userId)) {
      await ctx.db.patch(id, {
        readBy: [...readBy, userId],
        updatedAt: Date.now(),
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

/**
 * Seed sample announcements for an organization (mobile app support)
 */
export const seedSampleAnnouncements = mutation({
  args: {
    orgId: v.optional(v.string()),
  },
  handler: async (ctx, { orgId = "cmha-calgary" }) => {
    const existing = await ctx.db
      .query("announcements")
      .withIndex("by_org_created", (q) => q.eq("orgId", orgId))
      .take(1);

    if (existing.length > 0) {
      return { created: 0, notified: 0 };
    }

    const now = Date.now();

    const isSAIT = orgId === "sait";
    const samples = isSAIT
      ? [
          {
            title: "SAIT Wellness Week: Campus Mental Health Events",
            body:
              "SAIT Wellness Week — Join a range of events including stress reduction workshops, peer meetups, and campus wellbeing sessions. Open to all SAIT students and staff. Location: SAIT Campus, multiple buildings. Dates: Nov 18-22, 2025.",
          },
          {
            title: "SAIT: New Student Peer Support Circles",
            body:
              "We're launching peer support circles dedicated to student wellbeing starting December 1st. These small group sessions are run by trained peers and are open to all SAIT students. Register via the SAIT Student Services portal.",
          },
          {
            title: "SAIT Campus Wellness Initiative - Resilience and Community",
            body:
              "SAIT is proud to roll out a campus-wide Wellness Initiative featuring drop-in counselling, mindfulness classes, and academic resilience workshops. Programs will run January through June 2026. Free for SAIT students. Visit studentservices.sait.ca for registration and schedules.",
          },
        ]
      : [
          {
            title: "CMHA Calgary: Mental Health Awareness Week",
            body:
              "Join us for Mental Health Awareness Week featuring daily workshops, peer support sessions, and wellness activities. Free for all members. Location: CMHA Calgary Office, 1101 5 St SW. Dates: Nov 18-22, 2025.",
          },
          {
            title: "CMHA Calgary: New Peer Support Program Launch",
            body:
              "We're excited to announce our new peer support program starting December 1st! Connect with others who understand your journey. Virtual and in-person options available. Register now through our website or contact us at info@calgary.cmha.ca.",
          },
          {
            title: "CMHA Calgary: Community Wellness Initiative - Building Resilience Together",
            body:
              "We are thrilled to introduce our new Community Wellness Initiative, a comprehensive program designed to support mental health and well-being across Calgary. This initiative includes monthly support group meetings, one-on-one counseling sessions with certified mental health professionals, mindfulness and meditation workshops, art therapy classes, and family support programs. All services are offered on a sliding scale fee basis to ensure accessibility for everyone in our community. Special sessions will be held for youth (ages 13-18), young adults (19-29), and seniors (65+). The program runs from January through June 2026, with registration opening December 1st. Early bird discounts available for those who register before December 15th. For more information, visit our website at calgary.cmha.ca/wellness or call our community helpline at 403-297-1700. Together, we can build a stronger, more resilient community where mental health is a priority for all.",
          },
        ];

    for (const s of samples) {
      await ctx.db.insert("announcements", {
        orgId,
        title: s.title,
        body: s.body,
        visibility: "org",
        active: true,
        createdAt: now,
        updatedAt: now,
        readBy: [],
      });
    }

    // Notify all users in org about new announcements
    const usersInOrg = await ctx.db
      .query("users")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();

    await Promise.all(
      usersInOrg.flatMap((u) =>
        samples.map((s: { title: string; body: string }) =>
          ctx.db.insert("notifications", {
            userId: u.clerkId,
            type: "system",
            title: `New Announcement: ${s.title}`,
            message: s.body,
            isRead: false,
            createdAt: now,
          })
        )
      )
    );

    return { created: samples.length, notified: usersInOrg.length };
  },
});
