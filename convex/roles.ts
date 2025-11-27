/**
 * Roles management and initialization
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireSuperAdmin } from "./auth";
import { ROLE_PERMISSIONS, ROLE_LEVELS } from "./auth";

/**
 * List all roles
 */
export const list = query({
  handler: async (ctx) => {
    const roles = await ctx.db.query("roles").collect();
    return roles.sort((a, b) => a.level - b.level);
  },
});

/**
 * Get role by slug
 */
export const getBySlug = query({
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
 * Initialize default roles (SuperAdmin only, typically run once during setup)
 */
export const initializeRoles = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, { clerkId }) => {
    await requireSuperAdmin(ctx, clerkId);

    const defaultRoles = [
      {
        slug: "superadmin",
        name: "SuperAdmin",
        description: "System-wide administrator with full access to all organizations and settings",
        permissions: ROLE_PERMISSIONS.superadmin,
        level: ROLE_LEVELS.superadmin,
      },
      {
        slug: "admin",
        name: "Administrator",
        description: "Organization administrator with full access within their organization",
        permissions: ROLE_PERMISSIONS.admin,
        level: ROLE_LEVELS.admin,
      },
      {
        slug: "team_leader",
        name: "Team Leader",
        description: "Team leader with client assignment and oversight within their organization",
        permissions: ROLE_PERMISSIONS.team_leader,
        level: ROLE_LEVELS.team_leader,
      },
      {
        slug: "support_worker",
        name: "Support Worker (CMHA)",
        description: "Support worker with limited clinical access",
        permissions: ROLE_PERMISSIONS.support_worker,
        level: ROLE_LEVELS.support_worker,
      },
      {
        slug: "peer_support",
        name: "Peer Support (SAIT)",
        description: "Peer support with limited clinical access (same as Support Worker)",
        permissions: ROLE_PERMISSIONS.peer_support,
        level: ROLE_LEVELS.peer_support,
      },
      {
        slug: "client",
        name: "Client",
        description: "Client user with access to personal features only",
        permissions: ROLE_PERMISSIONS.client,
        level: ROLE_LEVELS.client,
      },
    ];

    const createdRoles = [];

    for (const roleData of defaultRoles) {
      // Check if role already exists
      const existing = await ctx.db
        .query("roles")
        .withIndex("by_slug", (q) => q.eq("slug", roleData.slug))
        .first();

      if (!existing) {
        const roleId = await ctx.db.insert("roles", {
          ...roleData,
          // Spread to convert readonly permissions into mutable array type
          permissions: [...roleData.permissions],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        createdRoles.push({ slug: roleData.slug, id: roleId });
      } else {
        // Update existing role with latest permissions
        await ctx.db.patch(existing._id, {
          permissions: [...roleData.permissions],
          updatedAt: Date.now(),
        });
        createdRoles.push({ slug: roleData.slug, id: existing._id, updated: true });
      }
    }

    // Log audit event
    await ctx.db.insert("auditLogs", {
      userId: clerkId,
      action: "roles_initialized",
      entityType: "role",
      details: JSON.stringify({ roles: createdRoles }),
      timestamp: Date.now(),
    });

    return createdRoles;
  },
});

/**
 * Update role permissions (SuperAdmin only)
 */
export const updatePermissions = mutation({
  args: {
    clerkId: v.string(),
    roleSlug: v.string(),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, { clerkId, roleSlug, permissions }) => {
    await requireSuperAdmin(ctx, clerkId);

    const role = await ctx.db
      .query("roles")
      .withIndex("by_slug", (q) => q.eq("slug", roleSlug))
      .first();

    if (!role) {
      throw new Error(`Role '${roleSlug}' not found`);
    }

    await ctx.db.patch(role._id, {
      permissions,
      updatedAt: Date.now(),
    });

    // Log audit event
    await ctx.db.insert("auditLogs", {
      userId: clerkId,
      action: "role_permissions_updated",
      entityType: "role",
      entityId: role._id,
      details: JSON.stringify({ roleSlug, permissions }),
      timestamp: Date.now(),
    });

    return role._id;
  },
});
