import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    userId: v.string(), // Clerk user ID of recipient
    message: v.string(),
    title: v.optional(v.string()),
    type: v.optional(v.string()), // e.g., 'referral' | 'system'
  },
  handler: async (ctx, { userId, message, title, type }) => {
    const now = Date.now();
    const id = await ctx.db.insert("notifications", {
      userId,
      title: title ?? "Notification",
      message,
      type: type ?? "system",
      isRead: false,
      createdAt: now,
    });
    return { id };
  },
});

export const markAllAsRead = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) => q.eq("userId", userId).eq("isRead", false))
      .collect();
    await Promise.all(unread.map((n) => ctx.db.patch(n._id, { isRead: true })));
    return { count: unread.length };
  },
});

export const toggleRead = mutation({
  args: { 
    notificationId: v.id("notifications"),
    isRead: v.boolean()
  },
  handler: async (ctx, { notificationId, isRead }) => {
    await ctx.db.patch(notificationId, { isRead });
    return { success: true };
  },
});

export const listMine = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const list = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(200);
    return list;
  },
});

// Alias for compatibility
export const getNotifications = query({
  args: { 
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit }) => {
    const list = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit || 200);
    return list;
  },
});

export const clearAll = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const all = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    await Promise.all(all.map((n) => ctx.db.delete(n._id)));
    return { count: all.length };
  },
});

/**
 * Get unread notification count (mobile app)
 */
export const getUnreadCount = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) => q.eq("userId", userId).eq("isRead", false))
      .collect();
    return { count: unreadNotifications.length };
  },
});

/**
 * Create a notification for a support worker when client shares mood/journal/post
 */
export const notifySupportWorker = mutation({
  args: {
    supportWorkerClerkId: v.string(),
    clientId: v.string(),
    clientName: v.string(),
    type: v.union(
      v.literal("mood_shared"),
      v.literal("journal_shared"),
      v.literal("post_shared")
    ),
    contentTitle: v.optional(v.string()),
    relatedId: v.optional(v.string()),
    orgId: v.optional(v.string()),
  },
  handler: async (
    ctx,
    {
      supportWorkerClerkId,
      clientId,
      clientName,
      type,
      contentTitle,
      relatedId,
      orgId,
    }
  ) => {
    const messageMap = {
      mood_shared: `${clientName} shared their mood entry with you${contentTitle ? `: ${contentTitle}` : ""}`,
      journal_shared: `${clientName} shared a journal entry with you${contentTitle ? `: ${contentTitle}` : ""}`,
      post_shared: `${clientName} shared a community post with you`,
    };

    const titleMap = {
      mood_shared: "Mood Entry Shared",
      journal_shared: "Journal Entry Shared",
      post_shared: "Community Post Shared",
    };

    const notification = await ctx.db.insert("notifications", {
      userId: supportWorkerClerkId,
      type: type,
      title: titleMap[type],
      message: messageMap[type],
      isRead: false,
      relatedId: relatedId || `client_${clientId}`,
      orgId: orgId,
      createdAt: Date.now(),
    });

    return {
      success: true,
      notificationId: notification,
      message: `Notification sent to support worker`,
    };
  },
});

/**
 * Create a notification for team leader/admin when client is assigned to support worker
 */
export const notifyClientAssignment = mutation({
  args: {
    leaderClerkId: v.string(),
    clientName: v.string(),
    supportWorkerName: v.string(),
    clientId: v.string(),
    orgId: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { leaderClerkId, clientName, supportWorkerName, clientId, orgId }
  ) => {
    const notification = await ctx.db.insert("notifications", {
      userId: leaderClerkId,
      type: "system",
      title: "Client Assignment Complete",
      message: `${clientName} has been assigned to support worker ${supportWorkerName}`,
      isRead: false,
      relatedId: `client_${clientId}`,
      orgId: orgId,
      createdAt: Date.now(),
    });

    return {
      success: true,
      notificationId: notification,
    };
  },
});

/**
 * Delete a single notification (mobile app)
 */
export const deleteNotification = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    await ctx.db.delete(notificationId);
    return { success: true };
  },
});

/**
 * Send email notification to support worker when client shares content
 */
export const sendShareNotificationEmail = mutation({
  args: {
    supportWorkerEmail: v.string(),
    supportWorkerName: v.string(),
    clientName: v.string(),
    contentType: v.union(v.literal("mood"), v.literal("journal"), v.literal("post")),
    contentTitle: v.optional(v.string()),
    contentSummary: v.optional(v.string()),
    clientDashboardUrl: v.optional(v.string()),
  },
  handler: async (
    ctx,
    {
      supportWorkerEmail,
      supportWorkerName,
      clientName,
      contentType,
      contentTitle,
      contentSummary,
      clientDashboardUrl,
    }
  ) => {
    // Create in-app notification
    const notification = await ctx.db.insert("notifications", {
      userId: supportWorkerEmail.split("@")[0], // This is a fallback, ideally use clerkId
      type: `${contentType}_shared`,
      title: `${clientName} Shared ${contentType === "mood" ? "Mood Entry" : contentType === "journal" ? "Journal Entry" : "Community Post"}`,
      message: `${clientName} shared their ${contentType} entry${contentTitle ? ": " + contentTitle : ""} with you`,
      isRead: false,
      relatedId: `shared_${contentType}_${Date.now()}`,
      createdAt: Date.now(),
    });

    // Send email via internal action
    // Note: You need to call this via an action or schedule it separately
    // For now, we'll prepare the email data
    const emailSubject = `${clientName} shared a ${contentType} entry with you`;
    const emailBody = `
Hi ${supportWorkerName},

${clientName} has shared a ${contentType} entry with you.

${contentTitle ? `Title: ${contentTitle}` : ""}
${contentSummary ? `Content: ${contentSummary}` : ""}

${clientDashboardUrl ? `View in dashboard: ${clientDashboardUrl}` : ""}

Best regards,
SafeSpace Team
    `.trim();

    // Log for email service integration
    console.log("📧 [sendShareNotificationEmail] Email prepared:", {
      to: supportWorkerEmail,
      subject: emailSubject,
      clientName,
      contentType,
      contentTitle,
    });

    return {
      success: true,
      notificationId: notification,
      emailData: {
        to: supportWorkerEmail,
        subject: emailSubject,
        body: emailBody,
      },
    };
  },
});