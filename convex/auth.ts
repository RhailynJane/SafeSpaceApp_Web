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

    const doc = {
      clerkId,
      email: args.email ?? identity.email ?? undefined,
      firstName: args.firstName ?? identity.givenName ?? undefined,
      lastName: args.lastName ?? identity.familyName ?? undefined,
      imageUrl: args.imageUrl ?? identity.pictureUrl ?? undefined,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, doc);
      return { updated: true };
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
