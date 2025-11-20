/**
 * Bootstrap utility to create a SuperAdmin user
 * This is a temporary helper - should only be used for initial setup
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Helper to show your Clerk ID - access this via Convex dashboard
 */
export const showMyClerkId = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    return {
      providedClerkId: args.clerkId,
      userExists: !!user,
      userDetails: user ? {
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.roleId,
        org: user.orgId,
      } : null,
    };
  },
});

/**
 * Create a SuperAdmin user without authorization checks
 * WARNING: This should only be used during initial setup
 */
export const createSuperAdmin = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      return {
        success: false,
        message: `User with clerkId ${args.clerkId} already exists`,
        userId: existing._id,
      };
    }

    // Check email uniqueness
    const existingEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (existingEmail) {
      return {
        success: false,
        message: `User with email ${args.email} already exists`,
        userId: existingEmail._id,
      };
    }

    // Create SuperAdmin user
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email.toLowerCase().trim(),
      firstName: args.firstName,
      lastName: args.lastName,
      roleId: "superadmin",
      orgId: "safespace",
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Log audit event
    await ctx.db.insert("auditLogs", {
      userId: args.clerkId,
      action: "superadmin_bootstrapped",
      entityType: "user",
      entityId: userId,
      details: JSON.stringify({ email: args.email }),
      timestamp: Date.now(),
    });

    return {
      success: true,
      message: `SuperAdmin user created successfully`,
      userId,
    };
  },
});
