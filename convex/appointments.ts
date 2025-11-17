/**
 * Appointments management with CMHA auto-assignment
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requirePermission, PERMISSIONS } from "./auth";

/**
 * Create an appointment. If org is 'cmha-calgary' and no supportWorkerId is provided,
 * automatically assign the least-loaded support worker (or peer support) in that org.
 * Also auto-assign the client to that worker if unassigned.
 */
export const create = mutation({
  args: {
    clerkId: v.string(),
    // Either web-style or mobile-style date/time
    appointmentDate: v.optional(v.string()), // YYYY-MM-DD
    appointmentTime: v.optional(v.string()), // HH:mm
    date: v.optional(v.string()), // mobile
    time: v.optional(v.string()), // mobile
    type: v.string(),
    notes: v.optional(v.string()),
    meetingLink: v.optional(v.string()),
    status: v.optional(v.string()),
    duration: v.optional(v.number()),
    orgId: v.optional(v.string()),
    clientDbId: v.optional(v.id("clients")),
    clientId: v.optional(v.string()), // keep legacy string id reference if used
    supportWorkerId: v.optional(v.string()), // Clerk ID; if omitted for CMHA, we auto-assign
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, args.clerkId, PERMISSIONS.MANAGE_APPOINTMENTS);

    // Normalize date/time across mobile/web fields
    const appointmentDate = args.appointmentDate ?? args.date;
    const appointmentTime = args.appointmentTime ?? args.time;

    if (!appointmentDate || !appointmentTime) {
      throw new Error("appointmentDate/time (or date/time) is required");
    }

    // Determine organization
    let orgId = args.orgId ?? null as string | null;
    let client = null as any;

    if (!orgId && args.clientDbId) {
      client = await ctx.db.get(args.clientDbId);
      if (client?.orgId) orgId = client.orgId;
    }

    // Auto-assign support worker for CMHA if not provided
    let assignedWorkerClerkId = args.supportWorkerId ?? null;

    const isCmha = orgId === "cmha-calgary";

    if (!assignedWorkerClerkId && isCmha) {
      // Get active workers in CMHA with role support_worker or peer_support
      const workers = (await ctx.db.query("users").withIndex("by_orgId", q => q.eq("orgId", "cmha-calgary")).collect())
        .filter(u => (u.roleId === "support_worker" || u.roleId === "peer_support") && (u.status ?? "active") === "active" && !!u.clerkId);

      if (workers.length === 0) {
        throw new Error("No available support workers in CMHA");
      }

      // Compute load: number of assigned clients per worker in this org
      const loads: Record<string, number> = {};
      for (const w of workers) {
        const assigned = await ctx.db
          .query("clients")
          .withIndex("by_assignedUser", q => q.eq("assignedUserId", w.clerkId))
          .collect();
        // Filter by org
        loads[w.clerkId] = assigned.filter(c => c.orgId === "cmha-calgary" && (c.status ?? "active") !== "inactive").length;
      }

      // Pick the least loaded worker
      assignedWorkerClerkId = workers.reduce((best, w) => {
        if (!best) return w.clerkId;
        return loads[w.clerkId] < loads[best] ? w.clerkId : best;
      }, workers[0].clerkId as string);

      // Auto-assign client if provided and currently unassigned
      if (!client && args.clientDbId) client = await ctx.db.get(args.clientDbId);
      if (client && !client.assignedUserId) {
        await ctx.db.patch(args.clientDbId!, { assignedUserId: assignedWorkerClerkId, updatedAt: Date.now() });
      }
    }

    const now = Date.now();

    const appointmentId = await ctx.db.insert("appointments", {
      // mobile-compatible fields
      date: appointmentDate,
      time: appointmentTime,
      // web fields
      appointmentDate,
      appointmentTime,
      duration: args.duration,
      type: args.type,
      status: args.status ?? "scheduled",
      notes: args.notes,
      meetingLink: args.meetingLink,
      clientId: args.clientId,
      scheduledByUserId: args.clerkId,
      supportWorkerId: assignedWorkerClerkId ?? undefined,
      orgId: orgId ?? undefined,
      createdAt: now,
      updatedAt: now,
    });

    // Basic audit log
    await ctx.db.insert("auditLogs", {
      userId: args.clerkId,
      action: "appointment_created",
      entityType: "appointment",
      entityId: appointmentId,
      details: JSON.stringify({ orgId, assignedWorkerClerkId, appointmentDate, appointmentTime, type: args.type }),
      timestamp: now,
    });

    return appointmentId;
  },
});

/**
 * Lightweight query to list appointments by date for an org or user
 */
export const listByDate = query({
  args: {
    clerkId: v.string(),
    date: v.string(), // YYYY-MM-DD
    orgId: v.optional(v.string()),
    userId: v.optional(v.string()), // mobile userId
  },
  handler: async (ctx, { clerkId, date, orgId, userId }) => {
    // Viewing appointments is permitted broadly among staff
    await requirePermission(ctx, clerkId, PERMISSIONS.VIEW_APPOINTMENTS);

    // Begin with a Query (not QueryInitializer) to keep typing consistent
    let q = ctx.db.query("appointments").fullTableScan();

    if (userId) {
      q = ctx.db
        .query("appointments")
        .withIndex("by_user_and_date", iq => iq.eq("userId", userId).eq("date", date));
    } else {
      q = ctx.db
        .query("appointments")
        .withIndex("by_appointmentDate", iq => iq.eq("appointmentDate", date));
    }

    const items = await q.collect();

    // Enrich with client names if available
    const withNames = await Promise.all(
      items.map(async (a) => {
        let clientName: string | undefined = undefined;
        if (a.clientId) {
          const client = await ctx.db
            .query("clients")
            .withIndex("by_orgId", (iq) => iq.eq("orgId", a.orgId || ""))
            .collect();
          const found = client.find((c) => c._id === (a as any).clientId);
          if (found) clientName = `${found.firstName || ""} ${found.lastName || ""}`.trim();
        }
        return { ...a, clientName };
      })
    );

    if (orgId) {
      return withNames.filter(a => a.orgId === orgId);
    }
    return withNames;
  },
});
