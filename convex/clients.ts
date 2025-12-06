import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { PERMISSIONS, requirePermission, isSuperAdmin, hasOrgAccess } from "./auth";

function sanitizeString(input: string | undefined, maxLength = 200): string | undefined {
  if (input == null) return undefined;
  const sanitized = String(input).replace(/[<>"'`]/g, "").trim();
  if (!sanitized) return undefined;
  return sanitized.slice(0, maxLength);
}

function validateEmail(email?: string) {
  if (!email) return;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) throw new Error("Invalid email format");
  if (email.length > 255) throw new Error("Email too long");
}

function validatePhone(phone?: string) {
  if (!phone) return;
  const phoneRegex = /^[\d\s()+-]+$/;
  if (!phoneRegex.test(phone)) throw new Error("Invalid phone number format");
  if (phone.length > 20) throw new Error("Phone number too long");
}

export const list = query({
  args: {
    clerkId: v.string(),
    orgId: v.optional(v.string()),
    status: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, orgId, status, search }) => {
    await requirePermission(ctx, clerkId, PERMISSIONS.VIEW_CLIENTS);

    // Scope by org unless SuperAdmin requests a specific org
    let q = ctx.db.query("clients").fullTableScan();

    const requester = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (iq) => iq.eq("clerkId", clerkId))
      .first();

    if (!requester) throw new Error("User not found");

    if (requester.roleId !== "superadmin") {
      if (!requester.orgId) throw new Error("User has no organization");
      q = ctx.db.query("clients").withIndex("by_orgId", (iq) => iq.eq("orgId", requester.orgId!));
    } else if (orgId) {
      q = ctx.db.query("clients").withIndex("by_orgId", (iq) => iq.eq("orgId", orgId));
    }

    let items = await q.collect();

    if (status) items = items.filter((c) => c.status === status);

    if (search) {
      const s = search.toLowerCase();
      items = items.filter((c) =>
        (c.firstName || "").toLowerCase().includes(s) ||
        (c.lastName || "").toLowerCase().includes(s) ||
        (c.email || "").toLowerCase().includes(s) ||
        (c.phone || "").toLowerCase().includes(s)
      );
    }

    // Sort by lastSessionDate desc then createdAt desc
    return items.sort((a, b) => (b.lastSessionDate || 0) - (a.lastSessionDate || 0) || b.createdAt - a.createdAt);
  },
});

export const create = mutation({
  args: {
    clerkId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    gender: v.optional(v.string()),
    emergencyContactName: v.optional(v.string()),
    emergencyContactPhone: v.optional(v.string()),
    assignedUserId: v.optional(v.string()), // Clerk ID
    orgId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { clerkId, orgId, ...data } = args;
    await requirePermission(ctx, clerkId, PERMISSIONS.MANAGE_CLIENTS);

    // Determine org: non-superadmin defaults to their org
    const me = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (iq) => iq.eq("clerkId", clerkId))
      .first();
    if (!me) throw new Error("User not found");

    let finalOrg = orgId;
    if (me.roleId !== "superadmin") finalOrg = me.orgId;

    if (!finalOrg) throw new Error("Organization is required");

    // Validate
    const firstName = sanitizeString(data.firstName, 100);
    const lastName = sanitizeString(data.lastName, 100);
    const email = sanitizeString(data.email ?? undefined, 255);
    const phone = sanitizeString(data.phone ?? undefined, 20);
    const address = sanitizeString(data.address ?? undefined, 500);
    const dob = sanitizeString(data.dateOfBirth ?? undefined, 20);
    const gender = sanitizeString(data.gender ?? undefined, 50);
    const eName = sanitizeString(data.emergencyContactName ?? undefined, 100);
    const ePhone = sanitizeString(data.emergencyContactPhone ?? undefined, 20);

    if (!firstName || !lastName) throw new Error("First and last name are required");
    validateEmail(email);
    validatePhone(phone);
    validatePhone(ePhone);

    // Email uniqueness within org
    if (email) {
      const existing = await ctx.db
        .query("clients")
        .withIndex("by_email", (iq) => iq.eq("email", email))
        .collect();
      if (existing.some((c) => c.orgId === finalOrg)) {
        throw new Error("Client with this email already exists in your organization");
      }
    }

    const now = Date.now();
    const id = await ctx.db.insert("clients", {
      firstName,
      lastName,
      email,
      phone,
      address,
      dateOfBirth: dob,
      gender,
      emergencyContactName: eName,
      emergencyContactPhone: ePhone,
      status: "active",
      riskLevel: "low",
      assignedUserId: args.assignedUserId,
      orgId: finalOrg,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      userId: clerkId,
      action: "client_created",
      entityType: "client",
      entityId: id,
      details: JSON.stringify({ firstName, lastName, orgId: finalOrg }),
      timestamp: now,
    });

    return id;
  },
});

export const update = mutation({
  args: {
    clerkId: v.string(),
    clientId: v.id("clients"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    gender: v.optional(v.string()),
    pronouns: v.optional(v.string()),
    primaryLanguage: v.optional(v.string()),
    mentalHealthConcerns: v.optional(v.string()),
    supportNeeded: v.optional(v.string()),
    ethnoculturalBackground: v.optional(v.string()),
    status: v.optional(v.string()),
    riskLevel: v.optional(v.string()),
    emergencyContactName: v.optional(v.string()),
    emergencyContactPhone: v.optional(v.string()),
    emergencyContactRelationship: v.optional(v.string()),
    assignedUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { clerkId, clientId, ...updates } = args;
    await requirePermission(ctx, clerkId, PERMISSIONS.MANAGE_CLIENTS);

    const existing = await ctx.db.get(clientId);
    if (!existing) throw new Error("Client not found");

    // Authorization: must be same org unless superadmin
    const me = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (iq) => iq.eq("clerkId", clerkId))
      .first();
    if (!me) throw new Error("User not found");

    if (me.roleId !== "superadmin") {
      if (!existing.orgId || me.orgId !== existing.orgId) {
        throw new Error("Unauthorized: Cannot update client from another organization");
      }
    }

    // Sanitize + validate
    const patch: any = {};
    if (updates.firstName !== undefined) patch.firstName = sanitizeString(updates.firstName, 100);
    if (updates.lastName !== undefined) patch.lastName = sanitizeString(updates.lastName, 100);
    if (updates.email !== undefined) {
      const email = sanitizeString(updates.email, 255);
      validateEmail(email);
      patch.email = email;
    }
    if (updates.phone !== undefined) {
      const phone = sanitizeString(updates.phone, 20);
      validatePhone(phone);
      patch.phone = phone;
    }
    if (updates.address !== undefined) patch.address = sanitizeString(updates.address, 500);
    if (updates.dateOfBirth !== undefined) patch.dateOfBirth = sanitizeString(updates.dateOfBirth, 20);
    if (updates.gender !== undefined) patch.gender = sanitizeString(updates.gender, 50);
    if (updates.pronouns !== undefined) patch.pronouns = sanitizeString(updates.pronouns, 50);
    if (updates.primaryLanguage !== undefined) patch.primaryLanguage = sanitizeString(updates.primaryLanguage, 50);
    if (updates.mentalHealthConcerns !== undefined) patch.mentalHealthConcerns = sanitizeString(updates.mentalHealthConcerns, 1000);
    if (updates.supportNeeded !== undefined) patch.supportNeeded = sanitizeString(updates.supportNeeded, 1000);
    if (updates.ethnoculturalBackground !== undefined) patch.ethnoculturalBackground = sanitizeString(updates.ethnoculturalBackground, 200);
    if (updates.status !== undefined) patch.status = sanitizeString(updates.status, 20);
    if (updates.riskLevel !== undefined) patch.riskLevel = sanitizeString(updates.riskLevel, 20);
    if (updates.emergencyContactName !== undefined) patch.emergencyContactName = sanitizeString(updates.emergencyContactName, 100);
    if (updates.emergencyContactPhone !== undefined) {
      const ePhone = sanitizeString(updates.emergencyContactPhone, 20);
      validatePhone(ePhone);
      patch.emergencyContactPhone = ePhone;
    }
    if (updates.emergencyContactRelationship !== undefined) patch.emergencyContactRelationship = sanitizeString(updates.emergencyContactRelationship, 100);
    if (updates.assignedUserId !== undefined) patch.assignedUserId = sanitizeString(updates.assignedUserId, 200);

    patch.updatedAt = Date.now();

    await ctx.db.patch(clientId, patch);

    await ctx.db.insert("auditLogs", {
      userId: clerkId,
      action: "client_updated",
      entityType: "client",
      entityId: clientId,
      details: JSON.stringify({ updates: patch }),
      timestamp: Date.now(),
    });

    // Return the updated client
    return await ctx.db.get(clientId);
  },
});

export const remove = mutation({
  args: {
    clerkId: v.string(),
    clientId: v.id("clients"),
  },
  handler: async (ctx, { clerkId, clientId }) => {
    await requirePermission(ctx, clerkId, PERMISSIONS.MANAGE_CLIENTS);

    const existing = await ctx.db.get(clientId);
    if (!existing) throw new Error("Client not found");

    // Authorization: must be same org unless superadmin
    const me = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (iq) => iq.eq("clerkId", clerkId))
      .first();
    if (!me) throw new Error("User not found");

    if (me.roleId !== "superadmin") {
      if (!existing.orgId || me.orgId !== existing.orgId) {
        throw new Error("Unauthorized: Cannot delete client from another organization");
      }
    }

    // Soft delete by updating status
    await ctx.db.patch(clientId, {
      status: 'deleted',
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const getById = query({
  args: {
    clerkId: v.string(),
    clientId: v.id("clients"),
  },
  handler: async (ctx, { clerkId, clientId }) => {
    await requirePermission(ctx, clerkId, PERMISSIONS.VIEW_CLIENTS);

    const client = await ctx.db.get(clientId);
    if (!client) return null;

    // Authorization: must be same org unless superadmin
    const me = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (iq) => iq.eq("clerkId", clerkId))
      .first();
    if (!me) throw new Error("User not found");

    if (me.roleId !== "superadmin") {
      if (!client.orgId || me.orgId !== client.orgId) {
        throw new Error("Unauthorized: Cannot view client from another organization");
      }
    }

    return client;
  },
});

export const listByOrg = query({
  args: { orgId: v.string() },
  handler: async (ctx, { orgId }) => {
    const items = await ctx.db
      .query("clients")
      .withIndex("by_orgId", (iq) => iq.eq("orgId", orgId))
      .collect();
    return items;
  },
});
