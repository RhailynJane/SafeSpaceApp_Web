import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { requireSuperAdmin } from "./auth";

// Valid feature keys - whitelist approach
const VALID_FEATURE_KEYS = [
  'selfAssessment', 'moodTracking', 'journaling', 'resources',
  'announcements', 'crisisSupport', 'messages', 'appointments',
  'communityForum', 'videoConsultations'
];

function validateFeatureKey(key: string): void {
  if (!VALID_FEATURE_KEYS.includes(key)) {
    throw new Error(`Invalid feature key: ${key}`);
  }
}

// Document shape for featurePermissions table
export type FeaturePermissionDoc = {
  _id: Id<"featurePermissions">;
  orgId: string;
  featureKey: string;
  enabled: boolean;
  updatedAt: number;
  updatedBy?: string;
};

// Central list of feature keys and display labels.
// Keep in sync with lib/features.js on the frontend.
export const FEATURE_DEFINITIONS: { key: string; label: string; defaultEnabled?: boolean; defaultRead?: boolean; defaultWrite?: boolean; defaultDelete?: boolean }[] = [
  { key: "selfAssessment", label: "Self-Assessment" },
  { key: "moodTracking", label: "Mood Tracking" },
  { key: "journaling", label: "Journaling" },
  { key: "resources", label: "Resources" },
  { key: "announcements", label: "Announcements" },
  { key: "crisisSupport", label: "Crisis Support" },
  { key: "messages", label: "Messages" },
  { key: "appointments", label: "Appointments" },
  { key: "communityForum", label: "Community Forum" },
  { key: "videoConsultations", label: "Video Consultations" },
];

// Default permissions if no record exists yet.
const DEFAULTS = { enabled: true };

// Helper to build default ACL rows
function buildDefault(per: { key: string; label: string }) {
  return {
    featureKey: per.key,
    label: per.label,
    ...DEFAULTS,
  };
}

// List feature permissions for an organization (by slug).
// Returns all features, filling in defaults for any missing records.
export const listByOrg = query({
  args: { 
    orgSlug: v.string(),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify SuperAdmin access
    if (args.clerkId) {
      await requireSuperAdmin(ctx, args.clerkId);
    }

    const org = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug))
      .unique();

    if (!org) {
      throw new Error("Organization not found");
    }

    // Prevent access to safespace org
    if (org.slug === "safespace") {
      throw new Error("Cannot manage permissions for safespace organization.");
    }

    const existing = await ctx.db
      .query("featurePermissions")
      .withIndex("by_org", (q) => q.eq("orgId", org.slug))
      .collect();

    const map: Map<string, FeaturePermissionDoc> = new Map(existing.map((row) => [row.featureKey, row as FeaturePermissionDoc]));

    return FEATURE_DEFINITIONS.map((def) => {
      const stored = map.get(def.key);
      if (stored) {
        return {
          featureKey: stored.featureKey,
          label: def.label,
          enabled: stored.enabled,
          _id: stored._id,
        };
      }
      return buildDefault(def);
    });
  },
});

// Upsert a single feature permission row.
export const updatePermission = mutation({
  args: {
    orgSlug: v.string(),
    featureKey: v.string(),
    enabled: v.optional(v.boolean()),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require SuperAdmin
    if (!args.updatedBy) {
      throw new Error("updatedBy clerkId is required");
    }
    await requireSuperAdmin(ctx, args.updatedBy);

    // Validate feature key
    validateFeatureKey(args.featureKey);

    const org = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug))
      .unique();

    if (!org) throw new Error("Organization not found");

    // Prevent modification of safespace org
    if (org.slug === "safespace") {
      throw new Error("Cannot modify permissions for safespace organization.");
    }

    // Find existing record
    const existing = await ctx.db
      .query("featurePermissions")
      .withIndex("by_org_and_feature", (q) => q.eq("orgId", org.slug).eq("featureKey", args.featureKey))
      .unique();

    const now = Date.now();

    if (!existing) {
      // Create with provided overrides applied to defaults
      const docId = await ctx.db.insert("featurePermissions", {
        orgId: org.slug, // store slug for consistency
        featureKey: args.featureKey,
        enabled: args.enabled ?? DEFAULTS.enabled,
        updatedAt: now,
        updatedBy: args.updatedBy,
      });
      return { _id: docId };
    } else {
      await ctx.db.patch(existing._id, {
        enabled: args.enabled ?? existing.enabled,
        updatedAt: now,
        updatedBy: args.updatedBy ?? existing.updatedBy,
      });
      return { _id: existing._id };
    }
  },
});

// Bulk update multiple feature rows.
export const bulkUpdate = mutation({
  args: {
    orgSlug: v.string(),
    updates: v.array(
      v.object({
        featureKey: v.string(),
        enabled: v.optional(v.boolean()),
      })
    ),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require SuperAdmin
    if (!args.updatedBy) {
      throw new Error("updatedBy clerkId is required");
    }
    await requireSuperAdmin(ctx, args.updatedBy);

    // Validate all feature keys before processing
    for (const upd of args.updates) {
      validateFeatureKey(upd.featureKey);
    }

    const org = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug))
      .unique();
    if (!org) throw new Error("Organization not found");

    // Prevent modification of safespace org
    if (org.slug === "safespace") {
      throw new Error("Cannot modify permissions for safespace organization.");
    }

    const existing = await ctx.db
      .query("featurePermissions")
      .withIndex("by_org", (q) => q.eq("orgId", org.slug))
      .collect();
    const map: Map<string, FeaturePermissionDoc> = new Map(existing.map((r) => [r.featureKey, r as FeaturePermissionDoc]));
    const now = Date.now();

    for (const upd of args.updates) {
      const current = map.get(upd.featureKey);
      if (!current) {
        await ctx.db.insert("featurePermissions", {
          orgId: org.slug,
          featureKey: upd.featureKey,
          enabled: upd.enabled ?? DEFAULTS.enabled,
          updatedAt: now,
          updatedBy: args.updatedBy,
        });
      } else {
        await ctx.db.patch(current._id, {
          enabled: upd.enabled ?? current.enabled,
          updatedAt: now,
          updatedBy: args.updatedBy ?? current.updatedBy,
        });
      }
    }

    return { success: true };
  },
});
