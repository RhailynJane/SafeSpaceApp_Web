/**
 * User management functions
 * Handles user CRUD operations with role-based access control
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireSuperAdmin, requirePermission, isSuperAdmin, hasOrgAccess, PERMISSIONS } from "./auth";

/**
 * List all users (SuperAdmin sees all, Admin sees only their org)
 */
export const list = query({
  args: {
    clerkId: v.string(),
    orgId: v.optional(v.string()),
    roleId: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, orgId, roleId, status }) => {
    await requirePermission(ctx, clerkId, PERMISSIONS.VIEW_USERS);

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

    // Start with a Query (not QueryInitializer) to avoid type narrowing issues
    let usersQuery = ctx.db.query("users").fullTableScan();

    // If not SuperAdmin, filter by organization
    if (currentUser.roleId !== "superadmin") {
      if (!currentUser.orgId) {
        throw new Error("User has no organization");
      }
      usersQuery = ctx.db
        .query("users")
        .withIndex("by_orgId", (q) => q.eq("orgId", currentUser.orgId));
    } else if (orgId) {
      // SuperAdmin can filter by specific org
      usersQuery = ctx.db
        .query("users")
        .withIndex("by_orgId", (q) => q.eq("orgId", orgId));
    }

    let users = await usersQuery.collect();

    // Apply additional filters
    if (roleId) {
      users = users.filter((u) => u.roleId === roleId);
    }
    if (status) {
      users = users.filter((u) => u.status === status);
    }

    // Sort by creation date (newest first)
    return users.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Get user by Clerk ID
 */
export const getByClerkId = query({
  args: {
    clerkId: v.string(),
    targetClerkId: v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, targetClerkId }) => {
    // If no targetClerkId provided, lookup self
    const lookupId = targetClerkId || clerkId;
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", lookupId))
      .first();

    if (!user) return null;

    // If looking up self, always allow
    if (lookupId === clerkId) {
      return user;
    }

    // Check if requesting user has access to target user
    const isSA = await isSuperAdmin(ctx, clerkId);
    const hasAccess = isSA || (await hasOrgAccess(ctx, clerkId, user.orgId || ""));

    if (!hasAccess) {
      throw new Error("Unauthorized: Cannot access user from different organization");
    }

    return user;
  },
});

/**
 * Get user by email
 */
export const getByEmail = query({
  args: {
    clerkId: v.string(),
    email: v.string(),
  },
  handler: async (ctx, { clerkId, email }) => {
    await requirePermission(ctx, clerkId, PERMISSIONS.VIEW_USERS);

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) return null;

    // Check if requesting user has access
    const isSA = await isSuperAdmin(ctx, clerkId);
    const hasAccess = isSA || (await hasOrgAccess(ctx, clerkId, user.orgId || ""));

    if (!hasAccess) {
      throw new Error("Unauthorized: Cannot access user from different organization");
    }

    return user;
  },
});

/**
 * Create a new user
 */
export const create = mutation({
  args: {
    clerkId: v.string(), // Creating user's Clerk ID
    newUserClerkId: v.string(), // New user's Clerk ID
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    roleId: v.string(),
    orgId: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    address: v.optional(v.string()),
    emergencyContactName: v.optional(v.string()),
    emergencyContactPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { clerkId, newUserClerkId, ...userData } = args;

    await requirePermission(ctx, clerkId, PERMISSIONS.CREATE_USERS);

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!currentUser) {
      throw new Error("Current user not found");
    }

    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", newUserClerkId))
      .first();

    if (existing) {
      throw new Error("User already exists");
    }

    // Check email uniqueness
    const existingEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", userData.email))
      .first();

    if (existingEmail) {
      throw new Error(`User with email '${userData.email}' already exists`);
    }

    // Determine orgId
    let finalOrgId = userData.orgId;
    if (currentUser.roleId !== "superadmin") {
      // Non-superadmins can only create users in their own org
      finalOrgId = currentUser.orgId;
    }

    // Validate that roleId is not superadmin unless creator is superadmin
    if (userData.roleId === "superadmin" && currentUser.roleId !== "superadmin") {
      throw new Error("Only SuperAdmins can create SuperAdmin users");
    }

    // Create user
      // Create user (set both imageUrl and profileImageUrl for mobile/web compatibility)
      const userId = await ctx.db.insert("users", {
        clerkId: newUserClerkId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        roleId: userData.roleId,
        orgId: finalOrgId,
        imageUrl: userData.profileImageUrl, // For mobile compatibility
        profileImageUrl: userData.profileImageUrl, // For web
        phoneNumber: userData.phoneNumber,
        address: userData.address,
        emergencyContactName: userData.emergencyContactName,
        emergencyContactPhone: userData.emergencyContactPhone,
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

    // Log audit event
    await ctx.db.insert("auditLogs", {
      userId: clerkId,
      action: "user_created",
      entityType: "user",
      entityId: userId,
      details: JSON.stringify({
        email: userData.email,
        roleId: userData.roleId,
        orgId: finalOrgId,
      }),
      timestamp: Date.now(),
    });

    return userId;
  },
});

/**
 * Update a user
 */
export const update = mutation({
  args: {
    clerkId: v.string(), // Updating user's Clerk ID
    targetClerkId: v.string(), // Target user's Clerk ID
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    roleId: v.optional(v.string()),
    orgId: v.optional(v.string()),
    status: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    address: v.optional(v.string()),
    emergencyContactName: v.optional(v.string()),
    emergencyContactPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { clerkId, targetClerkId, ...updates } = args;

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!currentUser) {
      throw new Error("Current user not found");
    }

    const targetUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", targetClerkId))
      .first();

    if (!targetUser) {
      throw new Error("Target user not found");
    }

    // Check permissions
    const isSA = currentUser.roleId === "superadmin";
    const sameOrg = currentUser.orgId === targetUser.orgId;

    if (!isSA && !sameOrg) {
      throw new Error("Unauthorized: Cannot update user from different organization");
    }

    // Prevent non-superadmins from changing role to superadmin
    if (updates.roleId === "superadmin" && !isSA) {
      throw new Error("Only SuperAdmins can assign SuperAdmin role");
    }

    // Prevent non-superadmins from changing orgId
    if (updates.orgId && !isSA) {
      throw new Error("Only SuperAdmins can change user organization");
    }

    // Check email uniqueness if updating email
    if (updates.email && updates.email !== targetUser.email) {
      const existingEmail = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", updates.email))
        .first();

      if (existingEmail) {
        throw new Error(`User with email '${updates.email}' already exists`);
      }
    }

    // Get the database ID
    const dbUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", targetClerkId))
      .first();

    if (!dbUser) {
      throw new Error("Target user not found in database");
    }

    await ctx.db.patch(dbUser._id, {
      ...updates,
      updatedAt: Date.now(),
    });

    // Log audit event
    await ctx.db.insert("auditLogs", {
      userId: clerkId,
      action: "user_updated",
      entityType: "user",
      entityId: dbUser._id,
      details: JSON.stringify({ targetClerkId, updates }),
      timestamp: Date.now(),
    });

    return dbUser._id;
  },
});

/**
 * Delete a user (SuperAdmin only)
 */
export const remove = mutation({
  args: {
    clerkId: v.string(),
    targetClerkId: v.string(),
  },
  handler: async (ctx, { clerkId, targetClerkId }) => {
    await requireSuperAdmin(ctx, clerkId);

    const targetUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", targetClerkId))
      .first();

    if (!targetUser) {
      throw new Error("Target user not found");
    }

    // Prevent deleting the last superadmin
    if (targetUser.roleId === "superadmin") {
      const superadmins = await ctx.db
        .query("users")
        .withIndex("by_roleId", (q) => q.eq("roleId", "superadmin"))
        .collect();

      if (superadmins.length <= 1) {
        throw new Error("Cannot delete the last SuperAdmin user");
      }
    }

    await ctx.db.delete(targetUser._id);

    // Log audit event
    await ctx.db.insert("auditLogs", {
      userId: clerkId,
      action: "user_deleted",
      entityType: "user",
      entityId: targetUser._id,
      details: JSON.stringify({
        email: targetUser.email,
        roleId: targetUser.roleId,
      }),
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update user's last login timestamp
 */
export const updateLastLogin = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) return null;

    await ctx.db.patch(user._id, {
      lastLogin: Date.now(),
        updatedAt: Date.now(),
    });

    return user._id;
  },
});

/**
 * Get user statistics for an organization
 */
export const getOrgUserStats = query({
  args: {
    clerkId: v.string(),
    orgId: v.string(),
  },
  handler: async (ctx, { clerkId, orgId }) => {
    const isSA = await isSuperAdmin(ctx, clerkId);
    const hasAccess = isSA || (await hasOrgAccess(ctx, clerkId, orgId));

    if (!hasAccess) {
      throw new Error("Unauthorized: Cannot access organization statistics");
    }

    const users = await ctx.db
      .query("users")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();

    const stats = {
      total: users.length,
      active: users.filter((u) => u.status === "active").length,
      inactive: users.filter((u) => u.status === "inactive").length,
      suspended: users.filter((u) => u.status === "suspended").length,
      byRole: {} as Record<string, number>,
    };

    // Count by role
    users.forEach((user) => {
      stats.byRole[user.roleId] = (stats.byRole[user.roleId] || 0) + 1;
    });

    return stats;
  },
});
