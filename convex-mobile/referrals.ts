import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List all referrals (admin/team leader only)
export const list = query({
  args: {},
  handler: async (ctx) => {
    const referrals = await ctx.db
      .query("referrals")
      .order("desc")
      .collect();
    
    return referrals;
  },
});

// Get a single referral by ID
export const getById = query({
  args: { id: v.id("referrals") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create a new referral
export const create = mutation({
  args: {
    client_first_name: v.string(),
    client_last_name: v.string(),
    age: v.optional(v.number()),
    gender: v.optional(v.string()),
    phone: v.optional(v.string()),
    secondary_phone: v.optional(v.string()),
    address: v.optional(v.string()),
    email: v.optional(v.string()),
    emergency_first_name: v.optional(v.string()),
    emergency_last_name: v.optional(v.string()),
    emergency_phone: v.optional(v.string()),
    preferred_contact_method: v.optional(v.string()),
    preferred_language: v.optional(v.string()),
    pronouns: v.optional(v.string()),
    availability_notes: v.optional(v.string()),
    referring_provider_name: v.optional(v.string()),
    referring_provider_phone: v.optional(v.string()),
    referring_provider_email: v.optional(v.string()),
    relationship_to_client: v.optional(v.string()),
    consent_date: v.optional(v.string()),
    referral_source: v.string(),
    reason_for_referral: v.optional(v.string()),
    additional_notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const referralId = await ctx.db.insert("referrals", {
      ...args,
      status: "Pending",
      submitted_date: now,
      created_at: now,
      updated_at: now,
    });
    
    return referralId;
  },
});

// Update referral status
export const updateStatus = mutation({
  args: {
    id: v.id("referrals"),
    status: v.string(),
    assigned_to: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, status, assigned_to } = args;
    
    await ctx.db.patch(id, {
      status,
      ...(assigned_to !== undefined && { assigned_to }),
      updated_at: Date.now(),
    });
    
    return { success: true };
  },
});

// Update a referral
export const update = mutation({
  args: {
    id: v.id("referrals"),
    client_first_name: v.optional(v.string()),
    client_last_name: v.optional(v.string()),
    age: v.optional(v.number()),
    gender: v.optional(v.string()),
    phone: v.optional(v.string()),
    secondary_phone: v.optional(v.string()),
    address: v.optional(v.string()),
    email: v.optional(v.string()),
    emergency_first_name: v.optional(v.string()),
    emergency_last_name: v.optional(v.string()),
    emergency_phone: v.optional(v.string()),
    preferred_contact_method: v.optional(v.string()),
    preferred_language: v.optional(v.string()),
    pronouns: v.optional(v.string()),
    availability_notes: v.optional(v.string()),
    referring_provider_name: v.optional(v.string()),
    referring_provider_phone: v.optional(v.string()),
    referring_provider_email: v.optional(v.string()),
    relationship_to_client: v.optional(v.string()),
    consent_date: v.optional(v.string()),
    referral_source: v.optional(v.string()),
    reason_for_referral: v.optional(v.string()),
    additional_notes: v.optional(v.string()),
    status: v.optional(v.string()),
    assigned_to: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    await ctx.db.patch(id, {
      ...cleanUpdates,
      updated_at: Date.now(),
    });
    
    return { success: true };
  },
});

// Delete a referral
export const remove = mutation({
  args: { id: v.id("referrals") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
