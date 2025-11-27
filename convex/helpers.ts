import { mutation } from "./_generated/server";
import { v } from "convex/values";
// Helper functions for manual data operations


/**
 * Manual helper to create safespace organization
 */
export const createSafespaceOrg = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", "safespace"))
      .first();

    if (existing) {
      console.log("SafeSpace org already exists");
      return { success: true, existed: true };
    }

    await ctx.db.insert("organizations", {
      name: "SafeSpace",
      slug: "safespace",
      description: "SafeSpace Development Team - System Organization (Hidden)",
      contactEmail: "safespace.dev.app@gmail.com",
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update SuperAdmin user to belong to safespace org
    const superadmin = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "safespace.dev.app@gmail.com"))
      .first();

    if (superadmin) {
      await ctx.db.patch(superadmin._id, {
        orgId: "safespace",
        updatedAt: Date.now(),
      });
      console.log("Updated SuperAdmin to safespace org");
    }

    return { success: true, existed: false };
  },
});
