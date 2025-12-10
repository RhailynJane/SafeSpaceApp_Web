import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get messages for a conversation
export const list = query({
  args: {
    conversationId: v.id("conversations")
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Verify user is a participant in this conversation
    const participant = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .first();

    // If user is not a participant (conversation was deleted or they were removed), return null
    // Frontend should handle this gracefully by clearing selection
    if (!participant) {
      return null;
    }

    // Get messages - limit to last 50 for now
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .order("desc")
      .take(50);

    // Get sender details for each message
    const messagesWithSenders = [];
    for (const message of messages) {
      const sender = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", message.senderId))
        .first();

      messagesWithSenders.push({
        ...message,
        sender: sender ? {
          id: sender.clerkId,
          firstName: sender.firstName,
          lastName: sender.lastName,
          imageUrl: sender.imageUrl || sender.profileImageUrl
        } : null
      });
    }

    return {
      page: messagesWithSenders.reverse() // Reverse to show oldest first
    };
  },
});

// Send a new message
export const send = mutation({
  args: {
    conversationId: v.id("conversations"),
    body: v.string(),
    messageType: v.optional(v.string()),
    attachmentUrl: v.optional(v.string()),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    storageId: v.optional(v.id("_storage"))
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Verify user is a participant in this conversation
    const participant = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .first();

    if (!participant) {
      throw new Error("Not authorized to send messages to this conversation");
    }

    // Create the message
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: identity.subject,
      body: args.body,
      messageType: args.messageType || "text",
      attachmentUrl: args.attachmentUrl,
      fileName: args.fileName,
      fileSize: args.fileSize,
      storageId: args.storageId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    // Update conversation's updatedAt
    await ctx.db.patch(args.conversationId, {
      updatedAt: Date.now()
    });

    return messageId;
  },
});

// Delete a message (soft delete by setting body to empty)
export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages")
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Only allow sender to delete their own messages
    if (message.senderId !== identity.subject) {
      throw new Error("Not authorized to delete this message");
    }

    await ctx.db.patch(args.messageId, {
      body: "This message was deleted",
      updatedAt: Date.now()
    });
  },
});