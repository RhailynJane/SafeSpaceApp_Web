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
    clientDbId: v.optional(v.string()), // Can be either a client ID or user ID since clients list includes user records
    clientId: v.optional(v.string()), // keep legacy string id reference if used
    supportWorkerId: v.optional(v.string()), // Clerk ID; if omitted for CMHA, we auto-assign
    supportWorkerName: v.optional(v.string()), // Support worker name for mobile display
    supportWorkerAvatar: v.optional(v.string()), // Support worker avatar for mobile display
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, args.clerkId, PERMISSIONS.MANAGE_APPOINTMENTS);

    // Normalize date/time across mobile/web fields
    const appointmentDate = args.appointmentDate ?? args.date;
    const appointmentTime = args.appointmentTime ?? args.time;

    if (!appointmentDate || !appointmentTime) {
      throw new Error("appointmentDate/time (or date/time) is required");
    }

    // Determine organization and get client info
    let orgId = args.orgId ?? null as string | null;
    let client = null as any;
    let clientIdToUse = args.clientDbId ?? args.clientId ?? null;

    if (clientIdToUse) {
      // Try to get the client from either clients or users table
      client = await ctx.db.get(clientIdToUse as any);
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

      // Auto-assign client if provided and currently unassigned (only if it's a legacy client doc)
      if (clientIdToUse && client?.status !== undefined && !client?.assignedUserId) {
        try {
          await ctx.db.patch(clientIdToUse as any, { assignedUserId: assignedWorkerClerkId, updatedAt: Date.now() });
        } catch (e) {
          // Might fail if it's a user record, which is fine
          console.log("Could not patch client, likely a user record:", e);
        }
      }
    }

    // Validate support worker availability and fetch their details
    let supportWorkerName = args.supportWorkerName ?? null;
    let supportWorkerAvatar = args.supportWorkerAvatar ?? null;
    if (assignedWorkerClerkId) {
      const worker = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", assignedWorkerClerkId))
        .first();
      if (worker) {
        supportWorkerName = supportWorkerName ?? (worker.firstName + (worker.lastName ? " " + worker.lastName : ""));
        supportWorkerAvatar = supportWorkerAvatar ?? worker.profileImageUrl;

        // Check worker availability for the scheduled time
        if (worker.availability && appointmentTime && appointmentDate) {
          const appointmentDateObj = new Date(appointmentDate);
          const dayOfWeek = appointmentDateObj.toLocaleDateString('en-US', { weekday: 'lowercase' });
          const daySlot = worker.availability.find((slot: any) => slot.day?.toLowerCase() === dayOfWeek);
          if (daySlot && !daySlot.enabled) {
            console.warn(`Worker ${assignedWorkerClerkId} is not available on ${dayOfWeek}`);
          }
        }
      }
    }

    const now = Date.now();

    const appointmentId = await ctx.db.insert("appointments", {
      // Store in both web and mobile field formats for cross-platform compatibility
      appointmentDate,
      appointmentTime,
      date: appointmentDate,
      time: appointmentTime,
      duration: args.duration,
      type: args.type,
      status: args.status ?? "scheduled",
      notes: args.notes,
      meetingLink: args.meetingLink,
      // Client linking - store both formats
      clientId: (args.clientDbId as any) ?? args.clientId,
      userId: (args.clientDbId as any) ?? args.clientId, // Mobile compatibility
      // Support worker info for mobile sync
      supportWorkerId: assignedWorkerClerkId ?? undefined,
      supportWorker: supportWorkerName ?? undefined,
      avatarUrl: supportWorkerAvatar ?? undefined,
      // Audit info
      scheduledByUserId: args.clerkId,
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
        .withIndex("by_user_and_date", iq => iq.eq("userId", userId).eq("appointmentDate", date));
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

/**
 * Query to list all appointments for an organization (no date filter)
 * Useful for modals that need to show complete appointment history
 */
export const list = query({
  args: {
    clerkId: v.string(),
    orgId: v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, orgId }) => {
    // Viewing appointments is permitted broadly among staff
    await requirePermission(ctx, clerkId, PERMISSIONS.VIEW_APPOINTMENTS);

    let items = await ctx.db.query("appointments").collect();

    // Filter by org if provided
    if (orgId) {
      items = items.filter(a => a.orgId === orgId);
    }

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

    return withNames;
  },
});

/**
 * Get all appointments for a user (mobile app)
 * Supports filtering by status and limiting results
 */
export const getUserAppointments = query({
  args: { 
    userId: v.string(),
    includeStatus: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, includeStatus, limit }) => {
    let appointments = await ctx.db
      .query("appointments")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(limit ?? 100);

    // Filter by status if provided
    if (includeStatus && includeStatus.length > 0) {
      appointments = appointments.filter(apt => includeStatus.includes(apt.status));
    }

    // Sort by appointmentDate then appointmentTime
    const sorted = appointments.sort((a, b) => {
      const dateA = a.appointmentDate || a.date || "";
      const dateB = b.appointmentDate || b.date || "";
      const dateCompare = dateA.localeCompare(dateB);
      if (dateCompare !== 0) return dateCompare;
      const timeA = a.appointmentTime || a.time || "";
      const timeB = b.appointmentTime || b.time || "";
      return timeA.localeCompare(timeB);
    });

    return sorted;
  },
});

/**
 * Get upcoming appointments for a user (mobile app)
 * Returns appointments with status 'scheduled' or 'confirmed' and date >= today
 */
export const getUpcomingAppointments = query({
  args: { 
    userId: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, { userId, limit = 50 }) => {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Get appointments with upcoming statuses (today or future dates)
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_user_and_date", (q) => 
        q.eq("userId", userId).gte("appointmentDate", today)
      )
      .filter((q) => 
        q.or(
          q.eq(q.field("status"), "scheduled"),
          q.eq(q.field("status"), "confirmed")
        )
      )
      .collect();

    // Sort by date then time (ascending)
    const sorted = appointments.sort((a, b) => {
      const dateCompare = a.appointmentDate.localeCompare(b.appointmentDate);
      if (dateCompare !== 0) return dateCompare;
      return (a.appointmentTime || "").localeCompare(b.appointmentTime || "");
    });

    return sorted.slice(0, limit);
  },
});

/**
 * Get past appointments for a user (mobile app)
 * Returns appointments with date < today or status completed/cancelled/no_show
 */
export const getPastAppointments = query({
  args: { 
    userId: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, { userId, limit = 50 }) => {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Get appointments with past dates (before today)
    const pastDates = await ctx.db
      .query("appointments")
      .withIndex("by_user_and_date", (q) => 
        q.eq("userId", userId).lt("appointmentDate", today)
      )
      .collect();
    
    // Get appointments with completed/cancelled/no_show status (regardless of date)
    const completedStatuses = await ctx.db
      .query("appointments")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) => 
        q.or(
          q.eq(q.field("status"), "completed"),
          q.eq(q.field("status"), "cancelled"),
          q.eq(q.field("status"), "no_show")
        )
      )
      .collect();
    
    // Combine and deduplicate
    const combined = [...pastDates, ...completedStatuses];
    const uniqueMap = new Map(combined.map(apt => [apt._id, apt]));
    const unique = Array.from(uniqueMap.values());
    
    // Sort by date then time (descending)
    const sorted = unique
      .sort((a, b) => {
        const dateCompare = b.appointmentDate.localeCompare(a.appointmentDate);
        if (dateCompare !== 0) return dateCompare;
        return (b.appointmentTime || "").localeCompare(a.appointmentTime || "");
      })
      .slice(0, limit);

    return sorted;
  },
});

/**
 * Get appointment statistics for a user (mobile app)
 */
export const getAppointmentStats = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const today = new Date().toISOString().split('T')[0];
    
    const upcoming = appointments.filter(apt => 
      (apt.status === "scheduled" || apt.status === "confirmed") && 
      apt.appointmentDate >= today
    );
    const completed = appointments.filter(apt => apt.status === "completed");
    const cancelled = appointments.filter(apt => apt.status === "cancelled");

    // Find next appointment
    const sortedUpcoming = upcoming.sort((a, b) => {
      const dateCompare = a.appointmentDate.localeCompare(b.appointmentDate);
      if (dateCompare !== 0) return dateCompare;
      return (a.appointmentTime || "").localeCompare(b.appointmentTime || "");
    });

    return {
      upcomingCount: upcoming.length,
      completedCount: completed.length,
      cancelledCount: cancelled.length,
      nextAppointment: sortedUpcoming[0] || null,
    };
  },
});

/**
 * Get single appointment by ID (mobile app)
 */
export const getAppointment = query({
  args: { appointmentId: v.optional(v.id("appointments")) },
  handler: async (ctx, { appointmentId }) => {
    if (!appointmentId) return null;
    const appointment = await ctx.db.get(appointmentId);
    return appointment || null;
  },
});

/**
 * Reschedule appointment (mobile app)
 */
export const rescheduleAppointment = mutation({
  args: {
    appointmentId: v.id("appointments"),
    newDate: v.string(),
    newTime: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { appointmentId, newDate, newTime, reason }) => {
    const appointment = await ctx.db.get(appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }
    
    const noteUpdate = reason 
      ? `${appointment.notes || ''}\n\nRescheduled: ${reason}`.trim()
      : appointment.notes;
    
    await ctx.db.patch(appointmentId, {
      appointmentDate: newDate,
      appointmentTime: newTime,
      notes: noteUpdate,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Cancel appointment (mobile app)
 */
export const cancelAppointment = mutation({
  args: {
    appointmentId: v.id("appointments"),
    cancellationReason: v.optional(v.string()),
  },
  handler: async (ctx, { appointmentId, cancellationReason }) => {
    const appointment = await ctx.db.get(appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }
    
    await ctx.db.patch(appointmentId, {
      status: "cancelled",
      cancellationReason,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update appointment status (mobile app)
 */
export const updateAppointmentStatus = mutation({
  args: {
    appointmentId: v.id("appointments"),
    status: v.string(),
  },
  handler: async (ctx, { appointmentId, status }) => {
    await ctx.db.patch(appointmentId, {
      status,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete an appointment (mobile app)
 */
export const deleteAppointment = mutation({
  args: {
    appointmentId: v.id("appointments"),
  },
  handler: async (ctx, { appointmentId }) => {
    await ctx.db.patch(appointmentId, {
      status: "cancelled",
      cancellationReason: "Deleted by user",
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});
