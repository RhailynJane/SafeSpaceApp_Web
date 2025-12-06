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
 * Delete a single notification (mobile app)
 */
export const deleteNotification = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    await ctx.db.delete(notificationId);
    return { success: true };
  },
});
