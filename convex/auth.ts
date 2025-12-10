/**
 * Authorization utilities for SafeSpace Convex functions
 * Provides role-based access control and permission checking
 */

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Role hierarchy levels (lower = more powerful)
 */
export const ROLE_LEVELS = {
  superadmin: 0,
  admin: 1,
  team_leader: 2,
  support_worker: 3,
  peer_support: 3,
  client: 4,
} as const;

/**
 * Permission definitions
 */
export const PERMISSIONS = {
  // Organization management (SuperAdmin only)
  MANAGE_ORGANIZATIONS: "manage_organizations",
  VIEW_ALL_ORGANIZATIONS: "view_all_organizations",
  
  // User management
  MANAGE_ALL_USERS: "manage_all_users", // SuperAdmin only
  MANAGE_ORG_USERS: "manage_org_users", // Admin in their org
  VIEW_USERS: "view_users",
  CREATE_USERS: "create_users",
  
  // Client management
  MANAGE_CLIENTS: "manage_clients",
  VIEW_CLIENTS: "view_clients",
  ASSIGN_CLIENTS: "assign_clients",
  
  // Clinical data
  MANAGE_NOTES: "manage_notes",
  VIEW_NOTES: "view_notes",
  
  // Appointments
  MANAGE_APPOINTMENTS: "manage_appointments",
  VIEW_APPOINTMENTS: "view_appointments",
  
  // Referrals
  MANAGE_REFERRALS: "manage_referrals",
  VIEW_REFERRALS: "view_referrals",
  PROCESS_REFERRALS: "process_referrals",
  
  // Crisis events
  MANAGE_CRISIS_EVENTS: "manage_crisis_events",
  VIEW_CRISIS_EVENTS: "view_crisis_events",
  
  // System
  VIEW_AUDIT_LOGS: "view_audit_logs",
  VIEW_SYSTEM_ALERTS: "view_system_alerts",
  MANAGE_SYSTEM_ALERTS: "manage_system_alerts",
  
  // Reports
  VIEW_REPORTS: "view_reports",
  GENERATE_REPORTS: "generate_reports",
} as const;

/**
 * Default permissions for each role
 */
export const ROLE_PERMISSIONS = {
  superadmin: [
    PERMISSIONS.MANAGE_ORGANIZATIONS,
    PERMISSIONS.VIEW_ALL_ORGANIZATIONS,
    PERMISSIONS.MANAGE_ALL_USERS,
    PERMISSIONS.MANAGE_ORG_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.CREATE_USERS,
    PERMISSIONS.MANAGE_CLIENTS,
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.ASSIGN_CLIENTS,
    PERMISSIONS.MANAGE_NOTES,
    PERMISSIONS.VIEW_NOTES,
    PERMISSIONS.MANAGE_APPOINTMENTS,
    PERMISSIONS.VIEW_APPOINTMENTS,
    PERMISSIONS.MANAGE_REFERRALS,
    PERMISSIONS.VIEW_REFERRALS,
    PERMISSIONS.PROCESS_REFERRALS,
    PERMISSIONS.MANAGE_CRISIS_EVENTS,
    PERMISSIONS.VIEW_CRISIS_EVENTS,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.VIEW_SYSTEM_ALERTS,
    PERMISSIONS.MANAGE_SYSTEM_ALERTS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.GENERATE_REPORTS,
  ],
  admin: [
    PERMISSIONS.MANAGE_ORG_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.CREATE_USERS,
    PERMISSIONS.MANAGE_CLIENTS,
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.ASSIGN_CLIENTS,
    PERMISSIONS.MANAGE_NOTES,
    PERMISSIONS.VIEW_NOTES,
    PERMISSIONS.MANAGE_APPOINTMENTS,
    PERMISSIONS.VIEW_APPOINTMENTS,
    PERMISSIONS.MANAGE_REFERRALS,
    PERMISSIONS.VIEW_REFERRALS,
    PERMISSIONS.PROCESS_REFERRALS,
    PERMISSIONS.MANAGE_CRISIS_EVENTS,
    PERMISSIONS.VIEW_CRISIS_EVENTS,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.VIEW_SYSTEM_ALERTS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.GENERATE_REPORTS,
  ],
  team_leader: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_CLIENTS,
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.ASSIGN_CLIENTS,
    PERMISSIONS.MANAGE_NOTES,
    PERMISSIONS.VIEW_NOTES,
    PERMISSIONS.MANAGE_APPOINTMENTS,
    PERMISSIONS.VIEW_APPOINTMENTS,
    PERMISSIONS.VIEW_REFERRALS,
    PERMISSIONS.PROCESS_REFERRALS,
    PERMISSIONS.MANAGE_CRISIS_EVENTS,
    PERMISSIONS.VIEW_CRISIS_EVENTS,
    PERMISSIONS.VIEW_REPORTS,
  ],
  support_worker: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.MANAGE_NOTES,
    PERMISSIONS.VIEW_NOTES,
    PERMISSIONS.MANAGE_APPOINTMENTS,
    PERMISSIONS.VIEW_APPOINTMENTS,
    PERMISSIONS.VIEW_REFERRALS,
    PERMISSIONS.MANAGE_CRISIS_EVENTS,
    PERMISSIONS.VIEW_CRISIS_EVENTS,
  ],
  peer_support: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.MANAGE_NOTES,
    PERMISSIONS.VIEW_NOTES,
    PERMISSIONS.MANAGE_APPOINTMENTS,
    PERMISSIONS.VIEW_APPOINTMENTS,
    PERMISSIONS.VIEW_REFERRALS,
    PERMISSIONS.MANAGE_CRISIS_EVENTS,
    PERMISSIONS.VIEW_CRISIS_EVENTS,
  ],
  client: [],
} as const;

/**
 * Get user by Clerk ID
 */
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();
    return user;
  },
});

/**
 * Get current user (whoami) - for mobile app
 */
export const whoami = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    
    const clerkId = identity.subject;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();
    
    return user;
  },
});

/**
 * Sync/upsert user from mobile app (Clerk authentication)
 */
export const syncUser = mutation({
  args: {
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const clerkId = identity.subject;
    const now = Date.now();

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    const doc: any = {
      clerkId,
      email: args.email ?? identity.email ?? undefined,
      firstName: args.firstName ?? identity.givenName ?? undefined,
      lastName: args.lastName ?? identity.familyName ?? undefined,
      imageUrl: args.imageUrl ?? identity.pictureUrl ?? undefined,
      updatedAt: now,
    };

    if (existing) {
      // If user already exists and has no orgId, check if there's a matching client record
      if (!existing.orgId) {
        // Try to find matching client record to get orgId
        const client = await ctx.db
          .query("clients")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
          .first();
        
        if (client && client.orgId) {
          doc.orgId = client.orgId;
          console.log(`[syncUser] Found matching client record with orgId: ${client.orgId}`);
        }
      }
      
      await ctx.db.patch(existing._id, doc);
      return { updated: true };
    }
    
    // For new users, check if there's a matching client record to get orgId
    const client = await ctx.db
      .query("clients")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();
    
    if (client && client.orgId) {
      doc.orgId = client.orgId;
      console.log(`[syncUser] Creating user with orgId from client record: ${client.orgId}`);
    }
    
    await ctx.db.insert("users", {
      ...doc,
      roleId: "client", // Default role for mobile users
      status: "active",
      createdAt: now,
    });
    return { created: true };
  },
});

/**
 * Get role by slug
 */
export const getRoleBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const role = await ctx.db
      .query("roles")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    return role;
  },
});

/**
 * Check if user has a specific permission
 */
export async function hasPermission(
  ctx: any,
  clerkId: string,
  permission: string
): Promise<boolean> {
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
    .first();

  if (!user || !user.roleId) {
    console.log('[hasPermission] User not found or no roleId:', { clerkId, user: user ? 'exists' : 'null' });
    return false;
  }

  // Get permissions from ROLE_PERMISSIONS map
  const rolePermissions = ROLE_PERMISSIONS[user.roleId as keyof typeof ROLE_PERMISSIONS] as readonly string[] | undefined;
  console.log('[hasPermission] Checking permission:', { 
    clerkId, 
    roleId: user.roleId, 
    permission, 
    hasRole: !!rolePermissions,
    hasPermission: rolePermissions ? (rolePermissions as string[]).includes(permission) : false
  });
  
  if (!rolePermissions) return false;

  return (rolePermissions as string[]).includes(permission);
}

/**
 * Check if user is SuperAdmin
 */
export async function isSuperAdmin(ctx: any, clerkId: string): Promise<boolean> {
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
    .first();

    return user?.roleId === "superadmin";
}

/**
 * Check if user is Admin (of any organization)
 */
export async function isAdmin(ctx: any, clerkId: string): Promise<boolean> {
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
    .first();

    if (!user || !user.roleId) return false;
    return user.roleId === "admin" || user.roleId === "superadmin";
}

/**
 * Get user's organization
 */
export async function getUserOrganization(ctx: any, clerkId: string) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
    .first();

  if (!user || !user.orgId) return null;

  const org = await ctx.db
    .query("organizations")
    .withIndex("by_slug", (q) => q.eq("slug", user.orgId))
    .first();

  return org;
}

/**
 * Verify user has access to a specific organization
 */
export async function hasOrgAccess(
  ctx: any,
  clerkId: string,
  orgId: string
): Promise<boolean> {
  // SuperAdmins have access to all organizations
  if (await isSuperAdmin(ctx, clerkId)) return true;

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
    .first();

  return user?.orgId === orgId;
}

/**
 * Require specific permission or throw error
 */
export async function requirePermission(
  ctx: any,
  clerkId: string,
  permission: string
) {
  const allowed = await hasPermission(ctx, clerkId, permission);
  if (!allowed) {
    throw new Error(`Unauthorized: Missing permission '${permission}'`);
  }
}

/**
 * Require SuperAdmin role or throw error
 */
export async function requireSuperAdmin(ctx: any, clerkId: string) {
  const isSA = await isSuperAdmin(ctx, clerkId);
  if (!isSA) {
    throw new Error("Unauthorized: SuperAdmin access required");
  }
}

/**
 * DEBUG: Check user orgId status (temporary helper)
 */
export const checkUserOrgId = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      return { found: false };
    }

    const client = await ctx.db
      .query("clients")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    return {
      found: true,
      user: {
        _id: user._id,
        clerkId: user.clerkId,
        firstName: user.firstName,
        lastName: user.lastName,
        orgId: user.orgId || null,
      },
      client: client ? {
        _id: client._id,
        firstName: client.firstName,
        lastName: client.lastName,
        orgId: client.orgId || null,
      } : null,
    };
  },
});

/**
 * DEBUG: Set a user's orgId directly (no client lookup needed)
 */
export const setUserOrgId = mutation({
  args: {
    clerkId: v.string(),
    orgId: v.string(),
  },
  handler: async (ctx, { clerkId, orgId }) => {
    // Verify org exists
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", orgId))
      .first();

    if (!org) {
      throw new Error(`Organization not found: ${orgId}`);
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, { orgId });
    console.log(`[setUserOrgId] Set user ${user.firstName} ${user.lastName} orgId to ${orgId}`);

    return {
      success: true,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        orgId,
      },
    };
  },
});

/**
 * DEBUG: Repair a specific user's orgId
 */
export const fixUserOrgId = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const client = await ctx.db
      .query("clients")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!client || !client.orgId) {
      throw new Error("No matching client record with orgId found");
    }

    await ctx.db.patch(user._id, { orgId: client.orgId });
    console.log(`[fixUserOrgId] Fixed user ${user.firstName} ${user.lastName} - set orgId to ${client.orgId}`);

    return {
      success: true,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        orgId: client.orgId,
      },
    };
  },
});

/**
 * DEBUG: Repair user records by populating orgId from client records
 * This is a temporary helper to fix existing user records that don't have orgId
 */
export const repairUserOrgIds = mutation({
  handler: async (ctx) => {
    // Get all users without orgId
    const usersWithoutOrg = await ctx.db.query("users").collect();
    const usersToRepair = usersWithoutOrg.filter((u: any) => !u.orgId);

    console.log(`[repairUserOrgIds] Found ${usersToRepair.length} users without orgId`);

    let repaired = 0;
    for (const user of usersToRepair) {
      // Try to find matching client record
      const client = await ctx.db
        .query("clients")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", user.clerkId))
        .first();

      if (client && client.orgId) {
        await ctx.db.patch(user._id, { orgId: client.orgId });
        console.log(`[repairUserOrgIds] Patched user ${user.firstName} ${user.lastName} with orgId: ${client.orgId}`);
        repaired++;
      }
    }

    return { repaired, total: usersToRepair.length };
  },
});
