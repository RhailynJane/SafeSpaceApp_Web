/**
 * Organization management functions
 * SuperAdmin-only access for creating, updating, and managing organizations
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireSuperAdmin, isSuperAdmin } from "./auth";

/**
 * List all organizations (SuperAdmin only)
 */
export const list = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, { clerkId }) => {
    await requireSuperAdmin(ctx, clerkId);

    const organizations = await ctx.db.query("organizations").collect();
    return organizations.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Get organization by slug
 */
export const getBySlug = query({
  args: {
    clerkId: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, { clerkId, slug }) => {
    await requireSuperAdmin(ctx, clerkId);

    const org = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    return org;
  },
});

/**
 * Get organization by ID
 */
export const getById = query({
  args: {
    clerkId: v.string(),
    id: v.id("organizations"),
  },
  handler: async (ctx, { clerkId, id }) => {
    await requireSuperAdmin(ctx, clerkId);

    const org = await ctx.db.get(id);
    return org;
  },
});

/**
 * Create a new organization (SuperAdmin only)
 */
export const create = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    address: v.optional(v.string()),
    website: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    settings: v.optional(v.object({
      maxUsers: v.optional(v.number()),
      features: v.optional(v.array(v.string())),
      customBranding: v.optional(v.boolean()),
    })),
  },
  handler: async (ctx, args) => {
    const { clerkId, ...orgData } = args;
    
    await requireSuperAdmin(ctx, clerkId);

    // Check if slug already exists
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error(`Organization with slug '${args.slug}' already exists`);
    }

    // Create organization
    const orgId = await ctx.db.insert("organizations", {
      name: orgData.name,
      slug: orgData.slug,
      description: orgData.description,
      contactEmail: orgData.contactEmail,
      contactPhone: orgData.contactPhone,
      address: orgData.address,
      website: orgData.website,
      logoUrl: orgData.logoUrl,
      status: "active",
      settings: orgData.settings,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: clerkId,
    });

    // Log audit event
    await ctx.db.insert("auditLogs", {
      userId: clerkId,
      action: "organization_created",
      entityType: "organization",
      entityId: orgId,
      details: JSON.stringify({ name: orgData.name, slug: orgData.slug }),
      timestamp: Date.now(),
    });

    return orgId;
  },
});

/**
 * Update an organization (SuperAdmin only)
 */
export const update = mutation({
  args: {
    clerkId: v.string(),
    id: v.id("organizations"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    address: v.optional(v.string()),
    website: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    status: v.optional(v.string()),
    settings: v.optional(v.object({
      maxUsers: v.optional(v.number()),
      features: v.optional(v.array(v.string())),
      customBranding: v.optional(v.boolean()),
    })),
  },
  handler: async (ctx, args) => {
    const { clerkId, id, ...updates } = args;
    
    await requireSuperAdmin(ctx, clerkId);

    const org = await ctx.db.get(id);
    if (!org) {
      throw new Error("Organization not found");
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    // Log audit event
    await ctx.db.insert("auditLogs", {
      userId: clerkId,
      action: "organization_updated",
      entityType: "organization",
      entityId: id,
      details: JSON.stringify({ slug: org.slug, updates }),
      timestamp: Date.now(),
    });

    return id;
  },
});

/**
 * Delete an organization (SuperAdmin only)
 * WARNING: This should be used carefully as it may affect users and data
 */
export const remove = mutation({
  args: {
    clerkId: v.string(),
    id: v.id("organizations"),
  },
  handler: async (ctx, { clerkId, id }) => {
    await requireSuperAdmin(ctx, clerkId);

    const org = await ctx.db.get(id);
    if (!org) {
      throw new Error("Organization not found");
    }

    // Check if organization has users
    const users = await ctx.db
      .query("users")
      .withIndex("by_orgId", (q) => q.eq("orgId", org.slug))
      .collect();

    if (users.length > 0) {
      throw new Error(
        `Cannot delete organization '${org.name}' because it has ${users.length} user(s). Please reassign or remove users first.`
      );
    }

    await ctx.db.delete(id);

    // Log audit event
    await ctx.db.insert("auditLogs", {
      userId: clerkId,
      action: "organization_deleted",
      entityType: "organization",
      entityId: id,
      details: JSON.stringify({ name: org.name, slug: org.slug }),
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get organization statistics (SuperAdmin only)
 */
export const getStats = query({
  args: {
    clerkId: v.string(),
    orgSlug: v.string(),
  },
  handler: async (ctx, { clerkId, orgSlug }) => {
    await requireSuperAdmin(ctx, clerkId);

    // Count users in organization
    const users = await ctx.db
      .query("users")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgSlug))
      .collect();

    // Count clients in organization
    const clients = await ctx.db
      .query("clients")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgSlug))
      .collect();

    // Count appointments
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgSlug))
      .collect();

    // Count referrals
    const referrals = await ctx.db
      .query("referrals")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgSlug))
      .collect();

    return {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.status === "active").length,
      totalClients: clients.length,
      activeClients: clients.filter((c) => c.status === "active").length,
      totalAppointments: appointments.length,
      totalReferrals: referrals.length,
      pendingReferrals: referrals.filter((r) => r.status === "pending").length,
    };
  },
});

/**
 * List all organizations for public/authenticated users (limited info)
 */
export const listPublic = query({
  handler: async (ctx) => {
    const organizations = await ctx.db
      .query("organizations")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Return only basic public information
    return organizations.map((org) => ({
      _id: org._id,
      name: org.name,
      slug: org.slug,
      description: org.description,
      logoUrl: org.logoUrl,
    }));
  },
});
