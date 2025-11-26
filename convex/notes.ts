import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { PERMISSIONS, requirePermission } from "./auth";

function sanitize(input: string | undefined, max = 2000) {
  if (input == null) return undefined;
  const s = String(input).replace(/[<>"'`]/g, "").trim();
  if (!s) return undefined;
  return s.slice(0, max);
}

export const listForUser = query({
  args: { clerkId: v.string(), orgId: v.optional(v.string()) },
  handler: async (ctx, { clerkId, orgId }) => {
    await requirePermission(ctx, clerkId, PERMISSIONS.VIEW_NOTES);

    // Scope to org if provided; else, infer from user
    let targetOrg = orgId as string | undefined;
    if (!targetOrg) {
      const me = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
        .first();
      targetOrg = me?.orgId ?? undefined;
    }

    // Basic list: either authored by user or (if team views later) org-wide
    // For now: return notes authored by the user
    let q = ctx.db
      .query("notes")
      .withIndex("by_author", (iq) => iq.eq("authorUserId", clerkId));

    const items = await q.collect();
    if (targetOrg) return items.filter((n) => n.orgId === targetOrg);
    return items;
  },
});

export const listByClient = query({
  args: { clerkId: v.string(), clientId: v.string() },
  handler: async (ctx, { clerkId, clientId }) => {
    await requirePermission(ctx, clerkId, PERMISSIONS.VIEW_NOTES);
    const items = await ctx.db
      .query("notes")
      .withIndex("by_client", (iq) => iq.eq("clientId", clientId))
      .collect();
    return items.sort((a, b) => (b.noteDate || "").localeCompare(a.noteDate || ""));
  },
});

export const listByOrg = query({
  args: { orgId: v.string() },
  handler: async (ctx, { orgId }) => {
    const items = await ctx.db
      .query("notes")
      .filter((q) => q.eq(q.field("orgId"), orgId))
      .collect();
    return items;
  },
});

export const create = mutation({
  args: {
    clerkId: v.string(),
    clientId: v.string(),
    authorUserId: v.optional(v.string()), // Optional: if provided, use this as the author instead of clerkId
    noteDate: v.string(), // YYYY-MM-DD
    sessionType: v.optional(v.string()),
    durationMinutes: v.optional(v.number()),
    summary: v.optional(v.string()),
    detailedNotes: v.optional(v.string()),
    riskAssessment: v.optional(v.string()),
    nextSteps: v.optional(v.string()),
    activities: v.optional(v.array(v.object({
      type: v.string(),
      minutes: v.union(v.number(), v.string())
    }))),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, args.clerkId, PERMISSIONS.MANAGE_NOTES);

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (!me) throw new Error("User not found");

    const now = Date.now();
    const id = await ctx.db.insert("notes", {
      clientId: args.clientId,
      authorUserId: args.authorUserId || args.clerkId, // Use provided author or fallback to current user
      noteDate: sanitize(args.noteDate, 20)!,
      sessionType: sanitize(args.sessionType, 50),
      durationMinutes: args.durationMinutes,
      summary: sanitize(args.summary, 1000),
      detailedNotes: sanitize(args.detailedNotes, 8000),
      riskAssessment: sanitize(args.riskAssessment, 50),
      nextSteps: sanitize(args.nextSteps, 1000),
      activities: args.activities,
      orgId: me.orgId,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      userId: args.clerkId,
      action: "note_created",
      entityType: "note",
      entityId: id,
      details: JSON.stringify({ clientId: args.clientId, noteDate: args.noteDate }),
      timestamp: now,
    });

    return id;
  },
});

export const update = mutation({
  args: {
    clerkId: v.string(),
    noteId: v.id("notes"),
    noteDate: v.optional(v.string()),
    sessionType: v.optional(v.string()),
    durationMinutes: v.optional(v.number()),
    summary: v.optional(v.string()),
    detailedNotes: v.optional(v.string()),
    riskAssessment: v.optional(v.string()),
    nextSteps: v.optional(v.string()),
    activities: v.optional(v.array(v.object({
      type: v.string(),
      minutes: v.union(v.number(), v.string())
    }))),
  },
  handler: async (ctx, { clerkId, noteId, ...updates }) => {
    await requirePermission(ctx, clerkId, PERMISSIONS.MANAGE_NOTES);

    const existing = await ctx.db.get(noteId);
    if (!existing) throw new Error("Note not found");

    // Only author or same-org staff can update; org scoping enforced via author
    const me = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();
    if (!me) throw new Error("User not found");

    if (existing.authorUserId !== clerkId && existing.orgId && me.orgId && existing.orgId !== me.orgId) {
      throw new Error("Unauthorized: Cannot modify note from another organization");
    }

    const patch: any = { updatedAt: Date.now() };
    if (updates.noteDate !== undefined) patch.noteDate = sanitize(updates.noteDate, 20);
    if (updates.sessionType !== undefined) patch.sessionType = sanitize(updates.sessionType, 50);
    if (updates.durationMinutes !== undefined) patch.durationMinutes = updates.durationMinutes;
    if (updates.summary !== undefined) patch.summary = sanitize(updates.summary, 1000);
    if (updates.detailedNotes !== undefined) patch.detailedNotes = sanitize(updates.detailedNotes, 8000);
    if (updates.riskAssessment !== undefined) patch.riskAssessment = sanitize(updates.riskAssessment, 50);
    if (updates.nextSteps !== undefined) patch.nextSteps = sanitize(updates.nextSteps, 1000);
    if (updates.activities !== undefined) patch.activities = updates.activities;

    await ctx.db.patch(noteId, patch);

    await ctx.db.insert("auditLogs", {
      userId: clerkId,
      action: "note_updated",
      entityType: "note",
      entityId: noteId,
      details: JSON.stringify({ updates: patch }),
      timestamp: Date.now(),
    });

    return noteId;
  },
});

export const remove = mutation({
  args: { clerkId: v.string(), noteId: v.id("notes") },
  handler: async (ctx, { clerkId, noteId }) => {
    await requirePermission(ctx, clerkId, PERMISSIONS.MANAGE_NOTES);
    const existing = await ctx.db.get(noteId);
    if (!existing) return { success: true };

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();
    if (!me) throw new Error("User not found");

    if (existing.authorUserId !== clerkId && existing.orgId && me.orgId && existing.orgId !== me.orgId) {
      throw new Error("Unauthorized: Cannot delete note from another organization");
    }

    await ctx.db.delete(noteId);

    await ctx.db.insert("auditLogs", {
      userId: clerkId,
      action: "note_deleted",
      entityType: "note",
      entityId: noteId,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});
