import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { PERMISSIONS, requirePermission, getUserOrganization, isAdmin } from "./auth";

function isValidEmail(email: string) {
  if (!email) return true;
  const re = /[^\s@]+@[^\s@]+\.[^\s@]+/;
  return re.test(String(email).toLowerCase());
}

function normalizePhone(input?: string | null) {
  if (!input) return undefined;
  const digits = String(input).replace(/\D/g, "");
  return digits || undefined;
}

function isValidPhone(digitsOnly?: string) {
  if (!digitsOnly) return true;
  const len = String(digitsOnly).length;
  return len >= 10 && len <= 15;
}

function isValidAge(n: any) {
  if (n === null || n === undefined || n === "") return true;
  const num = Number(n);
  return Number.isInteger(num) && num >= 0 && num <= 120;
}

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Allow admins and team leaders to view referrals
    const canView = await requirePermissionOr(ctx, identity.subject, [
      PERMISSIONS.MANAGE_REFERRALS,
      PERMISSIONS.VIEW_REFERRALS,
      PERMISSIONS.PROCESS_REFERRALS,
    ]);

    if (!canView) throw new Error("Unauthorized: View referrals required");

    // Optionally scope by org if user has org
    const org = await getUserOrganization(ctx, identity.subject);

    const results = org
      ? await ctx.db
          .query("referrals")
          .withIndex("by_orgId", (q) => q.eq("orgId", org.slug))
          .collect()
      : await ctx.db.query("referrals").collect();

    // Sort by submittedDate desc then createdAt desc
    results.sort((a: any, b: any) => (b.submittedDate ?? 0) - (a.submittedDate ?? 0) || b.createdAt - a.createdAt);

    return results;
  },
});

async function requirePermissionOr(ctx: any, clerkId: string, perms: string[]) {
  for (const p of perms) {
    try {
      await requirePermission(ctx, clerkId, p);
      return true;
    } catch {
      // ignore and continue
    }
  }
  return false;
}

export const create = mutation({
  args: {
    client_first_name: v.string(),
    client_last_name: v.string(),
    age: v.optional(v.number()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    email: v.optional(v.string()),
    emergency_first_name: v.optional(v.string()),
    emergency_last_name: v.optional(v.string()),
    emergency_phone: v.optional(v.string()),
    referral_source: v.string(),
    reason_for_referral: v.string(),
    additional_notes: v.optional(v.string()),
    // Extra composed fields are already rolled into additional_notes by client UI
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Only admins can create referrals (aligned with existing API)
    const isAdminUser = await isAdmin(ctx, identity.subject);
    if (!isAdminUser) throw new Error("Forbidden: Admin access required");

    // Validations
    if (args.email && !isValidEmail(args.email)) {
      throw new Error("Invalid email format");
    }

    if (args.age !== undefined && args.age !== null && !isValidAge(args.age)) {
      throw new Error("Age must be an integer between 0 and 120");
    }

    const phone = normalizePhone(args.phone);
    if (phone && !isValidPhone(phone)) throw new Error("Invalid phone number");

    const emergencyPhone = normalizePhone(args.emergency_phone);
    if (emergencyPhone && !isValidPhone(emergencyPhone)) throw new Error("Invalid emergency phone number");

    const now = Date.now();
    const org = await getUserOrganization(ctx, identity.subject);

    const referralId = await ctx.db.insert("referrals", {
      clientId: undefined,
      clientFirstName: args.client_first_name.trim(),
      clientLastName: args.client_last_name.trim(),
      age: args.age ?? undefined,
      phone,
      address: (args.address ?? "").trim() || undefined,
      email: (args.email ?? "").trim() || undefined,
      emergencyFirstName: (args.emergency_first_name ?? "").trim() || undefined,
      emergencyLastName: (args.emergency_last_name ?? "").trim() || undefined,
      emergencyPhone,
      referralSource: args.referral_source || "Unknown",
      reasonForReferral: args.reason_for_referral || "",
      additionalNotes: args.additional_notes || undefined,
      submittedDate: now,
      status: "pending",
      processedDate: undefined,
      processedByUserId: undefined,
      orgId: org?.slug,
      createdAt: now,
      updatedAt: now,
    });

    return { _id: referralId };
  },
});

export const updateStatus = mutation({
  args: {
    referralId: v.id("referrals"),
    status: v.string(), // 'in-review' | 'accepted' | 'declined'
    processed_by_user_id: v.optional(v.string()), // Clerk ID of TL/admin
  },
  handler: async (ctx, { referralId, status, processed_by_user_id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const allowed = await requirePermissionOr(ctx, identity.subject, [
      PERMISSIONS.MANAGE_REFERRALS,
      PERMISSIONS.PROCESS_REFERRALS,
    ]);
    if (!allowed) throw new Error("Unauthorized: Cannot process referrals");

    const existing = await ctx.db.get(referralId);
    if (!existing) throw new Error("Referral not found");

    const now = Date.now();

    await ctx.db.patch(referralId, {
      status,
      processedByUserId: processed_by_user_id ?? existing.processedByUserId,
      processedDate: status === "in-review" || status === "accepted" || status === "declined" ? now : existing.processedDate,
      updatedAt: now,
    });

    // Optional: insert timeline entry
    await ctx.db.insert("referralTimeline", {
      referralId,
      message: `Status changed to ${status}`,
      createdBy: identity.subject,
      createdAt: now,
    });

    return { ok: true };
  },
});
