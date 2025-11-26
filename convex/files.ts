import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Generate upload URL for file attachments
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    return await ctx.storage.generateUploadUrl();
  },
});

// Get file URL from storage ID  
export const getFileUrl = query({
  args: {
    storageId: v.id("_storage")
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});