/**
 * Organization management functions
 * SuperAdmin-only access for creating, updating, and managing organizations
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireSuperAdmin, isSuperAdmin } from "./auth";

// Input validation and sanitization helpers
function sanitizeString(input: string | undefined, maxLength: number = 255): string | undefined {
  if (!input) return undefined;
  // Remove potential XSS/injection characters
  const sanitized = input.trim().replace(/[<>"'`]/g, '');
  return sanitized.substring(0, maxLength);
}

function validateSlug(slug: string): void {
  // Slug must be alphanumeric with hyphens only, 3-50 chars
  const slugRegex = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;
  if (!slugRegex.test(slug)) {
    throw new Error("Invalid slug format. Must be 3-50 lowercase alphanumeric characters with hyphens.");
  }
  // Prevent reserved/sensitive slugs
  const reserved = ['admin', 'api', 'superadmin', 'system', 'root', 'safespace'];
  if (reserved.includes(slug.toLowerCase())) {
    throw new Error(`Slug '${slug}' is reserved and cannot be used.`);
  }
}

function validateEmail(email: string | undefined): void {
  if (!email) return;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format.");
  }
}

function validateUrl(url: string | undefined): void {
  if (!url) return;
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error("URL must use HTTP or HTTPS protocol.");
    }
  } catch {
    throw new Error("Invalid URL format.");
  }
}

/**
 * List all organizations (SuperAdmin only)
 */
export const list = query({
  args: {
    clerkId: v.string(),
    includeSafespace: v.optional(v.boolean()), // Allow including safespace org for account creation
  },
  handler: async (ctx, { clerkId, includeSafespace }) => {
    await requireSuperAdmin(ctx, clerkId);

    const organizations = await ctx.db.query("organizations").collect();
    
    // Filter out safespace org unless explicitly requested
    const visible = includeSafespace 
      ? organizations 
      : organizations.filter((o) => o.slug !== "safespace");
      
    return visible.sort((a, b) => b.createdAt - a.createdAt);
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
 * Get organization features for a user (mobile app access control)
 * Returns the list of enabled features for the user's organization
 */
export const getFeatures = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user || !user.orgId) {
      return [];
    }

    const org = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", user.orgId))
      .first();

    if (!org) {
      return [];
    }

    // Return enabled features or all features by default (for backward compatibility)
    return org.settings?.features || [
      'appointments',
      'video_consultation',
      'mood_tracking',
      'crisis_support',
      'resources',
      'community',
      'messaging',
      'assessments',
    ];
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

    // Input validation
    validateSlug(args.slug);
    validateEmail(args.contactEmail);
    validateUrl(args.website);
    validateUrl(args.logoUrl);

    const sanitizedName = sanitizeString(args.name, 100);
    if (!sanitizedName || sanitizedName.length < 2) {
      throw new Error("Organization name must be at least 2 characters.");
    }

    // Check if slug already exists
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error(`Organization with slug '${args.slug}' already exists`);
    }

    // Create organization with sanitized inputs
    const orgId = await ctx.db.insert("organizations", {
      name: sanitizedName,
      slug: args.slug.toLowerCase(),
      description: sanitizeString(orgData.description, 500),
      contactEmail: sanitizeString(orgData.contactEmail, 100),
      contactPhone: sanitizeString(orgData.contactPhone, 20),
      address: sanitizeString(orgData.address, 200),
      website: sanitizeString(orgData.website, 200),
      logoUrl: sanitizeString(orgData.logoUrl, 500),
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

    // Prevent modification of safespace org
    if (org.slug === "safespace") {
      throw new Error("Cannot modify the safespace organization.");
    }

    // Validate inputs
    if (updates.contactEmail) validateEmail(updates.contactEmail);
    if (updates.website) validateUrl(updates.website);
    if (updates.logoUrl) validateUrl(updates.logoUrl);
    if (updates.status && !['active', 'inactive', 'suspended'].includes(updates.status)) {
      throw new Error("Invalid status value.");
    }

    // Sanitize string inputs
    const sanitizedUpdates: any = {};
    if (updates.name) {
      const sanitized = sanitizeString(updates.name, 100);
      if (!sanitized || sanitized.length < 2) {
        throw new Error("Organization name must be at least 2 characters.");
      }
      sanitizedUpdates.name = sanitized;
    }
    if (updates.description !== undefined) sanitizedUpdates.description = sanitizeString(updates.description, 500);
    if (updates.contactEmail !== undefined) sanitizedUpdates.contactEmail = sanitizeString(updates.contactEmail, 100);
    if (updates.contactPhone !== undefined) sanitizedUpdates.contactPhone = sanitizeString(updates.contactPhone, 20);
    if (updates.address !== undefined) sanitizedUpdates.address = sanitizeString(updates.address, 200);
    if (updates.website !== undefined) sanitizedUpdates.website = sanitizeString(updates.website, 200);
    if (updates.logoUrl !== undefined) sanitizedUpdates.logoUrl = sanitizeString(updates.logoUrl, 500);
    if (updates.status !== undefined) sanitizedUpdates.status = updates.status;
    if (updates.settings !== undefined) sanitizedUpdates.settings = updates.settings;

    await ctx.db.patch(id, {
      ...sanitizedUpdates,
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

    // Prevent deletion of safespace org
    if (org.slug === "safespace") {
      throw new Error("Cannot delete the safespace organization.");
    }

    // Check if organization has users
    const users = await ctx.db
      .query("users")
      .withIndex("by_orgId", (q) => q.eq("orgId", org.slug))
      .collect();

    // Check if organization has clients
    const clients = await ctx.db
      .query("clients")
      .withIndex("by_orgId", (q) => q.eq("orgId", org.slug))
      .collect();

    const totalAssigned = users.length + clients.length;

    if (totalAssigned > 0) {
      throw new Error(
        `Cannot delete organization '${org.name}' because it has ${users.length} user(s) and ${clients.length} client(s) assigned. Please reassign or remove them first.`
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

    // Hide internal 'safespace' org from public list
    const visible = organizations.filter((o) => o.slug !== "safespace");

    // Return only basic public information
    return visible.map((org) => ({
      _id: org._id,
      name: org.name,
      slug: org.slug,
      description: org.description,
      logoUrl: org.logoUrl,
    }));
  },
});
