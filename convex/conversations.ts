import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all conversations for a user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get conversations where user is a participant
    const participantRecords = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    const conversations = [];
    for (const participant of participantRecords) {
      const conversation = await ctx.db.get(participant.conversationId);
      if (conversation) {
        // Get the latest message for preview
        const latestMessage = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
          .order("desc")
          .first();

        // Get all participants for this conversation
        const allParticipants = await ctx.db
          .query("conversationParticipants")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
          .collect();

        // Get participant user details
        const participantUsers = [];
        for (const p of allParticipants) {
          const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", p.userId))
            .first();
          
          if (user) {
            participantUsers.push({
              userId: p.userId,
              firstName: user.firstName,
              lastName: user.lastName,
              imageUrl: user.imageUrl || user.profileImageUrl,
              role: p.role
            });
          }
        }

        // Calculate unread count
        const unreadCount = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
          .filter((q) => q.gt(q.field("createdAt"), participant.lastReadAt || 0))
          .collect();

        conversations.push({
          ...conversation,
          latestMessage,
          participants: participantUsers,
          unreadCount: unreadCount.length,
          lastReadAt: participant.lastReadAt
        });
      }
    }

    // Sort by latest message time
    conversations.sort((a, b) => {
      const aTime = a.latestMessage?.createdAt || a.createdAt;
      const bTime = b.latestMessage?.createdAt || b.createdAt;
      return bTime - aTime;
    });

    return conversations;
  },
});

// Get or create a conversation between users
export const getOrCreate = mutation({
  args: {
    participantIds: v.array(v.string()),
    title: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const allParticipants = [...new Set([identity.subject, ...args.participantIds])];
    const participantKey = allParticipants.sort().join(",");

    // Check if conversation already exists
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_participantKey", (q) => q.eq("participantKey", participantKey))
      .first();

    if (existing) {
      return existing._id;
    }

    // Get user's org for new conversations
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    // Create new conversation
    const conversationId = await ctx.db.insert("conversations", {
      title: args.title,
      createdBy: identity.subject,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      participantKey,
      orgId: user?.orgId
    });

    // Add all participants
    for (const participantId of allParticipants) {
      await ctx.db.insert("conversationParticipants", {
        conversationId,
        userId: participantId,
        role: participantId === identity.subject ? "creator" : "participant",
        joinedAt: Date.now()
      });
    }

    return conversationId;
  },
});

// Mark conversation as read
export const markAsRead = mutation({
  args: {
    conversationId: v.id("conversations")
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const participant = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .first();

    if (participant) {
      await ctx.db.patch(participant._id, {
        lastReadAt: Date.now()
      });
    }
  },
});

// Delete conversation (only creator or admin can delete)
export const deleteConversation = mutation({
  args: {
    conversationId: v.id("conversations")
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if conversation exists and user has permission to delete it
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Only the creator can delete the conversation for now
    if (conversation.createdBy !== identity.subject) {
      throw new Error("Only the conversation creator can delete it");
    }

    // Delete all messages in the conversation
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete all participants
    const participants = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    for (const participant of participants) {
      await ctx.db.delete(participant._id);
    }

    // Finally, delete the conversation itself
    await ctx.db.delete(args.conversationId);

    return { success: true };
  },
});