/**
 * User management functions
 * Handles user CRUD operations with role-based access control
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireSuperAdmin, requirePermission, isSuperAdmin, hasOrgAccess, PERMISSIONS } from "./auth";

// Security: Input validation helpers
function sanitizeString(input: string | undefined, maxLength = 200): string {
  if (!input) return "";
  // Remove potentially dangerous characters
  const sanitized = input
    .replace(/[<>"'`]/g, "")
    .trim();
  // Enforce max length
  return sanitized.slice(0, maxLength);
}

function validateEmail(email: string): void {
  if (!email || typeof email !== 'string') {
    throw new Error("Email is required");
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format");
  }
  if (email.length > 255) {
    throw new Error("Email too long");
  }
}

function validatePhoneNumber(phone: string | undefined): void {
  if (!phone) return;
  // Basic phone validation: alphanumeric, spaces, hyphens, parentheses, plus sign
  const phoneRegex = /^[\d\s()+-]+$/;
  if (!phoneRegex.test(phone)) {
    throw new Error("Invalid phone number format");
  }
  if (phone.length > 20) {
    throw new Error("Phone number too long");
  }
}

function validateRoleId(roleId: string): void {
  const validRoles = ["client", "peer_support", "support_worker", "team_leader", "admin", "superadmin"];
  if (!validRoles.includes(roleId)) {
    throw new Error(`Invalid role: ${roleId}`);
  }
}

function validateStatus(status: string | undefined): void {
  if (!status) return;
  const validStatuses = ["active", "inactive", "suspended", "deleted"];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }
}

/**
 * List all users (SuperAdmin sees all, Admin sees only their org)
 */
export const list = query({
  args: {
    clerkId: v.string(),
    orgId: v.optional(v.string()),
    roleId: v.optional(v.string()),
    status: v.optional(v.string()),
    includeDeleted: v.optional(v.boolean()),
  },
  handler: async (ctx, { clerkId, orgId, roleId, status, includeDeleted }) => {
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
    } else if (!includeDeleted) {
      // By default, exclude deleted users unless explicitly requested
      users = users.filter((u) => u.status !== "deleted");
    }

    // Also fetch clients and include them in the list
    // Do a full table scan for now to ensure we get all clients
    let clients = await ctx.db.query("clients").collect();
    
    console.log("Fetched ALL clients count (before filtering):", clients.length);
    console.log("All clients data:", clients);
    
    // Apply org filtering for clients
    if (currentUser.roleId !== "superadmin") {
      if (currentUser.orgId) {
        clients = clients.filter((c) => c.orgId === currentUser.orgId);
      }
    } else if (orgId) {
      clients = clients.filter((c) => c.orgId === orgId);
    }
    
    console.log("After org filtering, clients count:", clients.length);

    // Apply status filter to clients
    if (status) {
      clients = clients.filter((c) => c.status === status);
    } else if (!includeDeleted) {
      clients = clients.filter((c) => c.status !== "deleted");
    }

    console.log("After filtering, clients count:", clients.length);

    // Transform clients to match user structure
    const clientsAsUsers = clients.map((c) => ({
      _id: c._id as any, // Cast to allow mixing client and user IDs
      _creationTime: c._creationTime,
      clerkId: "", // Clients don't have Clerk accounts
      email: c.email || "N/A",
      firstName: c.firstName || "",
      lastName: c.lastName || "",
      phoneNumber: c.phone || "",
      orgId: c.orgId,
      roleId: "client" as const,
      status: c.status || "active",
      createdAt: c.createdAt || c._creationTime,
      updatedAt: c.updatedAt || c._creationTime,
      lastLogin: 0, // Clients don't log in
    }));

    console.log("Transformed clients:", clientsAsUsers);

    // Filter clients by role if specified
    if (roleId && roleId !== "client") {
      // Don't include clients if filtering for non-client roles
      console.log("Skipping clients due to role filter:", roleId);
    } else {
      // Merge users and clients
      console.log("Merging", users.length, "users with", clientsAsUsers.length, "clients");
      users = [...users, ...clientsAsUsers];
    }

    console.log("Final users count:", users.length);

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

    // Validate and sanitize inputs
    validateEmail(userData.email);
    validateRoleId(userData.roleId);
    validatePhoneNumber(userData.phoneNumber);
    validatePhoneNumber(userData.emergencyContactPhone);

    const sanitizedFirstName = sanitizeString(userData.firstName, 100);
    const sanitizedLastName = sanitizeString(userData.lastName, 100);
    const sanitizedEmail = userData.email.toLowerCase().trim();
    const sanitizedPhone = sanitizeString(userData.phoneNumber, 20);
    const sanitizedAddress = sanitizeString(userData.address, 500);
    const sanitizedEmergencyName = sanitizeString(userData.emergencyContactName, 100);
    const sanitizedEmergencyPhone = sanitizeString(userData.emergencyContactPhone, 20);

    if (!sanitizedFirstName || !sanitizedLastName) {
      throw new Error("First name and last name are required");
    }

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
      .withIndex("by_email", (q) => q.eq("email", sanitizedEmail))
      .first();

    if (existingEmail) {
      throw new Error(`User with email '${sanitizedEmail}' already exists`);
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
        email: sanitizedEmail,
        firstName: sanitizedFirstName,
        lastName: sanitizedLastName,
        roleId: userData.roleId,
        orgId: finalOrgId,
        imageUrl: userData.profileImageUrl, // For mobile compatibility
        profileImageUrl: userData.profileImageUrl, // For web
        phoneNumber: sanitizedPhone || undefined,
        address: sanitizedAddress || undefined,
        emergencyContactName: sanitizedEmergencyName || undefined,
        emergencyContactPhone: sanitizedEmergencyPhone || undefined,
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

    // Validate inputs
    if (updates.email) validateEmail(updates.email);
    if (updates.roleId) validateRoleId(updates.roleId);
    if (updates.status) validateStatus(updates.status);
    if (updates.phoneNumber) validatePhoneNumber(updates.phoneNumber);
    if (updates.emergencyContactPhone) validatePhoneNumber(updates.emergencyContactPhone);

    // Sanitize string inputs
    const sanitizedUpdates: any = {};
    if (updates.firstName) sanitizedUpdates.firstName = sanitizeString(updates.firstName, 100);
    if (updates.lastName) sanitizedUpdates.lastName = sanitizeString(updates.lastName, 100);
    if (updates.email) sanitizedUpdates.email = updates.email.toLowerCase().trim();
    if (updates.phoneNumber) sanitizedUpdates.phoneNumber = sanitizeString(updates.phoneNumber, 20);
    if (updates.address) sanitizedUpdates.address = sanitizeString(updates.address, 500);
    if (updates.emergencyContactName) sanitizedUpdates.emergencyContactName = sanitizeString(updates.emergencyContactName, 100);
    if (updates.emergencyContactPhone) sanitizedUpdates.emergencyContactPhone = sanitizeString(updates.emergencyContactPhone, 20);
    if (updates.roleId) sanitizedUpdates.roleId = updates.roleId;
    if (updates.orgId) sanitizedUpdates.orgId = updates.orgId;
    if (updates.status) sanitizedUpdates.status = updates.status;
    if (updates.profileImageUrl) sanitizedUpdates.profileImageUrl = updates.profileImageUrl;

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
    if (sanitizedUpdates.roleId === "superadmin" && !isSA) {
      throw new Error("Only SuperAdmins can assign SuperAdmin role");
    }

    // Prevent non-superadmins from changing orgId
    if (sanitizedUpdates.orgId && !isSA) {
      throw new Error("Only SuperAdmins can change user organization");
    }

    // Check email uniqueness if updating email
    if (sanitizedUpdates.email && sanitizedUpdates.email !== targetUser.email) {
      const existingEmail = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", sanitizedUpdates.email))
        .first();

      if (existingEmail) {
        throw new Error(`User with email '${sanitizedUpdates.email}' already exists`);
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
      ...sanitizedUpdates,
      updatedAt: Date.now(),
    });

    // Log audit event
    await ctx.db.insert("auditLogs", {
      userId: clerkId,
      action: "user_updated",
      entityType: "user",
      entityId: dbUser._id,
      details: JSON.stringify({ targetClerkId, updates: sanitizedUpdates }),
      timestamp: Date.now(),
    });

    return dbUser._id;
  },
});

/**
 * Delete a user (SuperAdmin only)
 * Instead of hard-deleting, marks the user as deleted
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

    // Soft delete: mark as deleted instead of removing the record
    await ctx.db.patch(targetUser._id, {
      status: "deleted",
      updatedAt: Date.now(),
    });

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
 * Archive (soft-delete) a user
 * - Admins can archive users within their own org
 * - SuperAdmins can archive anyone
 */
export const archive = mutation({
  args: {
    clerkId: v.string(),
    targetClerkId: v.string(),
  },
  handler: async (ctx, { clerkId, targetClerkId }) => {
    // Must have org user management permission (admins and superadmins)
    await requirePermission(ctx, clerkId, PERMISSIONS.MANAGE_ORG_USERS);

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!currentUser) throw new Error("Current user not found");

    const targetUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", targetClerkId))
      .first();

    if (!targetUser) throw new Error("Target user not found");

    const isSA = currentUser.roleId === "superadmin";
    const sameOrg = currentUser.orgId && currentUser.orgId === targetUser.orgId;

    if (!isSA && !sameOrg) {
      throw new Error("Unauthorized: Cannot archive user from different organization");
    }

    // Only SuperAdmins can archive SuperAdmins
    if (targetUser.roleId === "superadmin" && !isSA) {
      throw new Error("Only SuperAdmins can archive SuperAdmin users");
    }

    // Prevent archiving the last SuperAdmin
    if (targetUser.roleId === "superadmin") {
      const superadmins = await ctx.db
        .query("users")
        .withIndex("by_roleId", (q) => q.eq("roleId", "superadmin"))
        .collect();
      if (superadmins.length <= 1) {
        throw new Error("Cannot archive the last SuperAdmin user");
      }
    }

    await ctx.db.patch(targetUser._id, {
      status: "deleted",
      updatedAt: Date.now(),
    });

    await ctx.db.insert("auditLogs", {
      userId: clerkId,
      action: "user_deleted",
      entityType: "user",
      entityId: targetUser._id,
      details: JSON.stringify({ email: targetUser.email, roleId: targetUser.roleId, soft: true }),
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

    const now = Date.now();
    await ctx.db.patch(user._id, {
      lastLogin: now,
      updatedAt: now,
    });

    // Audit log for login events (only log once per day to avoid spam)
    const lastLoginDate = user.lastLogin ? new Date(user.lastLogin).toISOString().slice(0, 10) : null;
    const todayDate = new Date(now).toISOString().slice(0, 10);
    
    if (lastLoginDate !== todayDate) {
      await ctx.db.insert("auditLogs", {
        userId: clerkId,
        action: "user_login",
        entityType: "user",
        entityId: user._id,
        details: JSON.stringify({ 
          email: user.email,
          role: user.roleId,
          orgId: user.orgId 
        }),
        orgId: user.orgId,
        timestamp: now,
      });
    }

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

/**
 * Get team leaders (supervisors) for an organization
 */
export const getTeamLeaders = query({
  args: {
    clerkId: v.string(),
    orgId: v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, orgId }) => {
    // Get requesting user
    const requestingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!requestingUser) {
      throw new Error("User not found");
    }

    // Use requesting user's org if not specified
    const targetOrgId = orgId || requestingUser.orgId;

    if (!targetOrgId) {
      throw new Error("Organization not specified");
    }

    // Check access
    const isSA = await isSuperAdmin(ctx, clerkId);
    const hasAccess = isSA || (await hasOrgAccess(ctx, clerkId, targetOrgId));

    if (!hasAccess) {
      throw new Error("Unauthorized: Cannot access organization team leaders");
    }

    // Get all team leaders for the organization
    const teamLeaders = await ctx.db
      .query("users")
      .withIndex("by_orgId", (q) => q.eq("orgId", targetOrgId))
      .filter((q) => q.eq(q.field("roleId"), "team_leader"))
      .filter((q) => q.neq(q.field("status"), "deleted"))
      .collect();

    return teamLeaders.map((tl) => ({
      _id: tl._id,
      firstName: tl.firstName,
      lastName: tl.lastName,
      email: tl.email,
      profileImageUrl: tl.profileImageUrl,
      phoneNumber: tl.phoneNumber,
    }));
  },
});

/**
 * Self-sync/register mutation
 * Allows users to create or update their own record without requiring admin permissions
 * Used for automatic user synchronization from Clerk
 */
export const syncSelf = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    roleId: v.string(),
    orgId: v.string(),
    profileImageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate inputs
    validateEmail(args.email);
    validateRoleId(args.roleId);

    const sanitizedFirstName = sanitizeString(args.firstName, 100);
    const sanitizedLastName = sanitizeString(args.lastName, 100);
    const sanitizedEmail = args.email.toLowerCase().trim();

    if (!sanitizedFirstName || !sanitizedLastName) {
      throw new Error("First name and last name are required");
    }

    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing user if orgId or roleId is missing
      const updates: any = {
        updatedAt: now,
        lastLogin: now,
      };

      if (!existing.orgId) {
        updates.orgId = args.orgId;
      }
      if (!existing.roleId) {
        updates.roleId = args.roleId;
      }
      if (!existing.firstName) {
        updates.firstName = sanitizedFirstName;
      }
      if (!existing.lastName) {
        updates.lastName = sanitizedLastName;
      }
      if (!existing.email) {
        updates.email = sanitizedEmail;
      }
      if (args.profileImageUrl && !existing.profileImageUrl) {
        updates.profileImageUrl = args.profileImageUrl;
        updates.imageUrl = args.profileImageUrl; // Mobile compatibility
      }

      await ctx.db.patch(existing._id, updates);
      return existing._id;
    } else {
      // Create new user
      const userId = await ctx.db.insert("users", {
        clerkId: args.clerkId,
        email: sanitizedEmail,
        firstName: sanitizedFirstName,
        lastName: sanitizedLastName,
        roleId: args.roleId,
        orgId: args.orgId,
        profileImageUrl: args.profileImageUrl,
        imageUrl: args.profileImageUrl, // Mobile compatibility
        status: "active",
        createdAt: now,
        updatedAt: now,
        lastLogin: now,
      });

      return userId;
    }
  },
});
