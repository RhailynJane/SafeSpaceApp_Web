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

    // Fetch requester to determine org scope
    const requester = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (iq) => iq.eq("clerkId", clerkId))
      .first();

    if (!requester) throw new Error("User not found");

    const targetOrgId = requester.roleId === "superadmin" ? orgId ?? undefined : requester.orgId;
    if (requester.roleId !== "superadmin" && !targetOrgId) {
      throw new Error("User has no organization");
    }

    // Pull clients table rows (legacy) scoped by org when applicable
    let clientDocs = targetOrgId
      ? await ctx.db.query("clients").withIndex("by_orgId", (iq) => iq.eq("orgId", targetOrgId)).collect()
      : await ctx.db.query("clients").fullTableScan().collect();

    // Pull user records that are roleId="client" so the list always mirrors client users
    let userClients = targetOrgId
      ? await ctx.db.query("users").withIndex("by_orgId", (iq) => iq.eq("orgId", targetOrgId)).collect()
      : await ctx.db.query("users").fullTableScan().collect();
    userClients = userClients.filter((u) => u.roleId === "client");

    // Apply status filters consistently across both sources
    const applyStatus = <T extends { status?: string }>(items: T[]): T[] => {
      if (status) return items.filter((c) => c.status === status);
      return items.filter((c) => c.status !== "deleted");
    };

    clientDocs = applyStatus(clientDocs);
    userClients = applyStatus(userClients);

    // Map user client records into the client shape used by the UI
    const mappedUserClients = userClients.map((u) => ({
      _id: u._id as any,
      _creationTime: u._creationTime,
      orgId: u.orgId,
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      email: u.email || "",
      phone: (u as any).phoneNumber || "",
      status: u.status || "active",
      riskLevel: "low",
      lastSessionDate: u.lastLogin || u.updatedAt || u.createdAt || u._creationTime,
      createdAt: u.createdAt || u._creationTime,
      updatedAt: u.updatedAt || u._creationTime,
      clerkId: u.clerkId,
      assignedUserId: (u as any).assignedUserId || "", // Support worker assignment
    }));

    // Normalize clientDocs to include assignedUserId field
    const normalizedClientDocs = clientDocs.map((c) => ({
      ...c,
      assignedUserId: (c as any).assignedUserId || "", // Ensure field exists
    }));

    // Combine and deduplicate (prefer explicit clients table rows when emails collide)
    const combinedMap = new Map<string, any>();
    for (const c of [...mappedUserClients, ...normalizedClientDocs]) {
      const key = (c.email || c._id || "").toString().toLowerCase();
      combinedMap.set(key, c);
    }

    let items = Array.from(combinedMap.values());

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
    return items.sort((a, b) => (b.lastSessionDate || 0) - (a.lastSessionDate || 0) || (b.createdAt || 0) - (a.createdAt || 0));
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
    
    // Determine assigned support worker (auto-assign to least-loaded worker)
    let assignedUserId = args.assignedUserId; // Use provided assignment if given
    
    if (!assignedUserId && finalOrg) {
      // Get all support workers in the org
      const supportWorkers = await ctx.db
        .query("users")
        .withIndex("by_orgId", (iq) => iq.eq("orgId", finalOrg))
        .collect();
      
      const swList = supportWorkers.filter((u) => u.roleId === "support_worker");
      
      if (swList.length > 0) {
        // Count clients per support worker
        const loads = {};
        for (const sw of swList) {
          const count = await ctx.db
            .query("clients")
            .withIndex("by_assignedUser", (iq) => iq.eq("assignedUserId", sw._id as any))
            .collect();
          loads[sw._id as any] = count.length;
        }
        
        // Find worker with minimum load
        const minWorker = swList.reduce((min, current) => 
          loads[current._id as any] < loads[min._id as any] ? current : min
        );
        
        assignedUserId = minWorker._id as any;
      }
    }
    
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
      assignedUserId: assignedUserId || undefined,
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

/**
 * Assign client to support worker with load balancing
 * Finds the support worker with the least number of assigned clients
 * and assigns the client to them
 */
export const assignToSupportWorker = mutation({
  args: {
    clientId: v.string(), // Accept string ID (works for both clients and users tables)
    clerkId: v.string(),
    supportWorkerId: v.optional(v.string()), // If provided, assign to specific worker
  },
  handler: async (ctx, { clientId, clerkId, supportWorkerId }) => {
    // Verify permission to assign
    await requirePermission(ctx, clerkId, PERMISSIONS.ASSIGN_CLIENTS);

    // Try to get the client from clients table first
    let client: any = null;
    let isUserClient = false;
    let clientTableId: any = null;

    try {
      // Try as clients table ID
      clientTableId = clientId as any;
      client = await ctx.db.get(clientTableId);
    } catch (e) {
      // Not a valid clients table ID
    }

    // If not found or wrong type, search both tables
    if (!client) {
      const allClients = await ctx.db.query("clients").collect();
      const foundClient = allClients.find(c => c._id.toString() === clientId || c._id === clientId);
      
      if (foundClient) {
        client = foundClient;
        clientTableId = foundClient._id;
      } else {
        // Try users table
        const allUsers = await ctx.db.query("users").collect();
        const foundUser = allUsers.find(u => (u._id.toString() === clientId || u._id === clientId) && u.roleId === "client");
        
        if (foundUser) {
          client = foundUser;
          clientTableId = foundUser._id;
          isUserClient = true;
        }
      }
    }

    if (!client) {
      throw new Error("Client not found");
    }

    // Type check for user clients
    if (isUserClient && (client as any).roleId !== "client") {
      throw new Error("User is not a client");
    }

    // Get requester to determine org
    const requester = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (iq) => iq.eq("clerkId", clerkId))
      .first();
    if (!requester) throw new Error("User not found");

    const orgId = (client as any).orgId || requester.orgId;
    if (!orgId) throw new Error("Unable to determine organization");

    let assignedWorkerId = supportWorkerId;

    // If no specific worker provided, find the one with lowest load
    if (!assignedWorkerId) {
      // Get all active support workers in the org
      const workers = (
        await ctx.db
          .query("users")
          .withIndex("by_orgId", (iq) => iq.eq("orgId", orgId))
          .collect()
      ).filter(
        (u) =>
          (u.roleId === "support_worker" || u.roleId === "peer_support") &&
          (u.status ?? "active") === "active" &&
          !!u.clerkId
      );

      if (workers.length === 0) {
        throw new Error("No available support workers in this organization");
      }

      // Calculate load for each worker (number of assigned clients from both sources)
      const loads: Record<string, number> = {};
      for (const worker of workers) {
        const clientDocs = await ctx.db
          .query("clients")
          .withIndex("by_assignedUser", (iq) => iq.eq("assignedUserId", worker.clerkId))
          .collect();
        
        const userClients = (
          await ctx.db
            .query("users")
            .withIndex("by_orgId", (iq) => iq.eq("orgId", orgId))
            .collect()
        ).filter(
          (u) =>
            u.roleId === "client" &&
            (u as any).assignedUserId === worker.clerkId
        );

        loads[worker.clerkId] = clientDocs.length + userClients.length;
      }

      // Find worker with minimum load
      assignedWorkerId = workers.reduce((minWorker, worker) => {
        return loads[worker.clerkId] < loads[minWorker.clerkId] ? worker : minWorker;
      }).clerkId;
    }

    // Update client with assigned worker (use the actual table ID)
    await ctx.db.patch(clientTableId, {
      assignedUserId: assignedWorkerId,
      updatedAt: Date.now(),
    });

    // Get the assigned worker for notification
    const assignedWorker = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (iq) => iq.eq("clerkId", assignedWorkerId))
      .first();

    return {
      success: true,
      clientId,
      assignedWorkerId,
      assignedWorkerName: assignedWorker ? `${assignedWorker.firstName || ""} ${assignedWorker.lastName || ""}`.trim() : "Support Worker",
    };
  },
});

/**
 * Bulk assign unassigned clients to support workers with load balancing
 */
export const bulkAssignClients = mutation({
  args: {
    orgId: v.string(),
    clerkId: v.string(),
  },
  handler: async (ctx, { orgId, clerkId }) => {
    await requirePermission(ctx, clerkId, PERMISSIONS.ASSIGN_CLIENTS);

    // Get all unassigned clients from both sources (including empty strings)
    const unassignedClientDocs = (
      await ctx.db
        .query("clients")
        .withIndex("by_orgId", (iq) => iq.eq("orgId", orgId))
        .collect()
    ).filter((c) => !c.assignedUserId || c.assignedUserId.trim() === "");

    const unassignedUserClients = (
      await ctx.db
        .query("users")
        .withIndex("by_orgId", (iq) => iq.eq("orgId", orgId))
        .collect()
    ).filter((u) => u.roleId === "client" && (!(u as any).assignedUserId || (u as any).assignedUserId.trim() === ""));

    const unassignedClients = [...unassignedClientDocs, ...unassignedUserClients];

    if (unassignedClients.length === 0) {
      return { success: true, assigned: 0, message: "No unassigned clients found" };
    }

    // Get all active support workers
    const workers = (
      await ctx.db
        .query("users")
        .withIndex("by_orgId", (iq) => iq.eq("orgId", orgId))
        .collect()
    ).filter(
      (u) =>
        (u.roleId === "support_worker" || u.roleId === "peer_support") &&
        (u.status ?? "active") === "active" &&
        !!u.clerkId
    );

    if (workers.length === 0) {
      throw new Error("No available support workers in this organization");
    }

    // Calculate initial loads from both sources
    const loads: Record<string, number> = {};
    for (const worker of workers) {
      const clientDocs = await ctx.db
        .query("clients")
        .withIndex("by_assignedUser", (iq) => iq.eq("assignedUserId", worker.clerkId))
        .collect();
      
      const userClients = (
        await ctx.db
          .query("users")
          .withIndex("by_orgId", (iq) => iq.eq("orgId", orgId))
          .collect()
      ).filter(
        (u) =>
          u.roleId === "client" &&
          (u as any).assignedUserId === worker.clerkId
      );

      loads[worker.clerkId] = clientDocs.length + userClients.length;
    }

    // Assign clients to worker with lowest current load
    let assignedCount = 0;
    for (const client of unassignedClients) {
      // Find worker with minimum load
      const minWorkerId = Object.keys(loads).reduce((min, id) =>
        loads[id] < loads[min] ? id : min
      );

      await ctx.db.patch(client._id, {
        assignedUserId: minWorkerId,
        updatedAt: Date.now(),
      });

      loads[minWorkerId]++;
      assignedCount++;
    }

    return {
      success: true,
      assigned: assignedCount,
      message: `Successfully assigned ${assignedCount} clients`,
    };
  },
});

/**
 * Get unassigned clients in an organization
 */
export const getUnassignedClients = query({
  args: { clerkId: v.string(), orgId: v.string() },
  handler: async (ctx, { clerkId, orgId }) => {
    await requirePermission(ctx, clerkId, PERMISSIONS.VIEW_CLIENTS);

    const unassignedClients = (
      await ctx.db
        .query("clients")
        .withIndex("by_orgId", (iq) => iq.eq("orgId", orgId))
        .collect()
    ).filter((c) => !c.assignedUserId);

    return unassignedClients;
  },
});

/**
 * Get all clients with their assigned support worker details
 */
export const getClientAssignments = query({
  args: { clerkId: v.string(), orgId: v.string() },
  handler: async (ctx, { clerkId, orgId }) => {
    await requirePermission(ctx, clerkId, PERMISSIONS.VIEW_CLIENTS);

    // Get clients from both sources (clients table and users table with roleId="client")
    const clientDocs = await ctx.db
      .query("clients")
      .withIndex("by_orgId", (iq) => iq.eq("orgId", orgId))
      .collect();

    const userClients = (
      await ctx.db
        .query("users")
        .withIndex("by_orgId", (iq) => iq.eq("orgId", orgId))
        .collect()
    ).filter((u) => u.roleId === "client");

    // Normalize and combine both sources
    const normalizedClientDocs = clientDocs.map((c) => ({
      ...c,
      assignedUserId: (c as any).assignedUserId || "",
    }));

    const mappedUserClients = userClients.map((u) => ({
      _id: u._id as any,
      _creationTime: u._creationTime,
      orgId: u.orgId,
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      email: u.email || "",
      phone: (u as any).phoneNumber || "",
      status: u.status || "active",
      riskLevel: "low",
      lastSessionDate: u.lastLogin || u.updatedAt || u.createdAt || u._creationTime,
      createdAt: u.createdAt || u._creationTime,
      updatedAt: u.updatedAt || u._creationTime,
      clerkId: u.clerkId,
      assignedUserId: (u as any).assignedUserId || "",
    }));

    // Combine and deduplicate
    const combinedMap = new Map<string, any>();
    for (const c of [...mappedUserClients, ...normalizedClientDocs]) {
      const key = (c.email || c._id || "").toString().toLowerCase();
      combinedMap.set(key, c);
    }

    const clients = Array.from(combinedMap.values());

    // Enrich with support worker details
    const enrichedClients = await Promise.all(
      clients.map(async (client) => {
        let assignedWorker = null;
        if (client.assignedUserId) {
          assignedWorker = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (iq) => iq.eq("clerkId", client.assignedUserId))
            .first();
        }
        return {
          ...client,
          assignedWorker: assignedWorker
            ? {
                clerkId: assignedWorker.clerkId,
                firstName: assignedWorker.firstName,
                lastName: assignedWorker.lastName,
                email: assignedWorker.email,
              }
            : null,
        };
      })
    );

    return enrichedClients;
  },
});

/**
 * Get clients assigned to a specific support worker
 */
export const getClientsByAssignedWorker = query({
  args: { clerkId: v.string(), workerClerkId: v.string() },
  handler: async (ctx, { clerkId, workerClerkId }) => {
    // Get requester's org
    const requester = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (iq) => iq.eq("clerkId", clerkId))
      .first();
    if (!requester) throw new Error("User not found");

    await requirePermission(ctx, clerkId, PERMISSIONS.VIEW_CLIENTS);

    const clients = await ctx.db
      .query("clients")
      .withIndex("by_assignedUser", (iq) => iq.eq("assignedUserId", workerClerkId))
      .collect();

    return clients;
  },
});

/**
 * Get support worker load (count of assigned clients)
 */
export const getSupportWorkerLoad = query({
  args: { clerkId: v.string(), orgId: v.string() },
  handler: async (ctx, { clerkId, orgId }) => {
    await requirePermission(ctx, clerkId, PERMISSIONS.VIEW_CLIENTS);

    const workers = (
      await ctx.db
        .query("users")
        .withIndex("by_orgId", (iq) => iq.eq("orgId", orgId))
        .collect()
    ).filter(
      (u) =>
        (u.roleId === "support_worker" || u.roleId === "peer_support") &&
        (u.status ?? "active") === "active" &&
        !!u.clerkId
    );

    const workerLoads = await Promise.all(
      workers.map(async (worker) => {
        // Get clients from both clients table and users table
        const clientDocAssignments = await ctx.db
          .query("clients")
          .withIndex("by_assignedUser", (iq) => iq.eq("assignedUserId", worker.clerkId))
          .collect();

        const userClientAssignments = (
          await ctx.db
            .query("users")
            .withIndex("by_orgId", (iq) => iq.eq("orgId", orgId))
            .collect()
        ).filter(
          (u) =>
            u.roleId === "client" &&
            (u as any).assignedUserId === worker.clerkId
        );

        // Combine and deduplicate
        const allAssignedMap = new Map<string, any>();
        for (const c of [...clientDocAssignments, ...userClientAssignments]) {
          const key = (c.email || c._id || "").toString().toLowerCase();
          allAssignedMap.set(key, c);
        }

        const allAssignedClients = Array.from(allAssignedMap.values());

        return {
          clerkId: worker.clerkId,
          firstName: worker.firstName,
          lastName: worker.lastName,
          email: worker.email,
          clientCount: allAssignedClients.length,
          clients: allAssignedClients,
        };
      })
    );

    return workerLoads.sort((a, b) => a.clientCount - b.clientCount);
  },
});

/**
 * Get client statistics (mood shared, journal shared, crisis calls)
 * Returns counts for each client with recent activity data
 */
export const getClientStatistics = query({
  args: {
    clerkId: v.string(),
    orgId: v.string(),
  },
  handler: async (ctx, { clerkId, orgId }) => {
    await requirePermission(ctx, clerkId, PERMISSIONS.VIEW_CLIENTS);

    // Get all clients in this organization
    const clientsFromClientsTable = await ctx.db
      .query("clients")
      .filter((q) => q.eq(q.field("orgId"), orgId))
      .collect();

    const clientsFromUsersTable = await ctx.db
      .query("users")
      .filter((q) => 
        q.and(
          q.eq(q.field("roleId"), "client"),
          q.eq(q.field("orgId"), orgId)
        )
      )
      .collect();

    // Get all client clerkIds
    const allClientIds = [
      ...clientsFromClientsTable.map(c => c.clerkId).filter(Boolean),
      ...clientsFromUsersTable.map(c => c.clerkId)
    ];

    // Get statistics for each client
    const stats = await Promise.all(
      allClientIds.map(async (userId) => {
        // Count moods shared with support worker
        const moodsShared = await ctx.db
          .query("moods")
          .filter((q) => 
            q.and(
              q.eq(q.field("userId"), userId),
              q.eq(q.field("shareWithSupportWorker"), true)
            )
          )
          .collect();

        // Count journals shared with support worker
        // Note: Journal functionality to be implemented
        const journalsShared: any[] = [];

        // Count crisis calls (check activities table for crisis-related activities)
        const crisisCalls = await ctx.db
          .query("activities")
          .filter((q) => 
            q.and(
              q.eq(q.field("userId"), userId),
              q.eq(q.field("activityType"), "crisis_support")
            )
          )
          .collect();

        // Get client info
        let clientInfo = clientsFromClientsTable.find(c => c.clerkId === userId);
        if (!clientInfo) {
          const userRecord = clientsFromUsersTable.find(u => u.clerkId === userId);
          if (userRecord) {
            clientInfo = {
              _id: userRecord._id as any,
              _creationTime: userRecord._creationTime,
              clerkId: userRecord.clerkId,
              firstName: userRecord.firstName,
              lastName: userRecord.lastName,
              email: userRecord.email,
              assignedUserId: userRecord.assignedUserId,
              createdAt: userRecord.createdAt,
              updatedAt: userRecord.updatedAt,
            } as any;
          }
        }

        if (!clientInfo) return null;

        return {
          clientId: userId,
          _id: clientInfo._id,
          firstName: clientInfo.firstName || "Unknown",
          lastName: clientInfo.lastName || "",
          email: clientInfo.email,
          assignedUserId: clientInfo.assignedUserId,
          moodSharedCount: moodsShared.length,
          journalSharedCount: journalsShared.length,
          crisisCallCount: crisisCalls.length,
          totalSharedCount: moodsShared.length + journalsShared.length,
          // Get recent moods for risk analysis
          recentMoods: moodsShared.slice(-5).map(m => ({
            type: m.moodType,
            intensity: m.intensity,
            createdAt: m.createdAt,
            notes: m.notes,
          })),
          // Get recent journals for risk analysis
          recentJournals: [],  // To be implemented when journals table is added
        };
      })
    );

    return stats.filter(Boolean);
  },
});

/**
 * Get detailed activity logs for a specific client (for Analytics "View More")
 * Includes all moods, journals, and crisis calls with filtering options
 */
export const getClientDetailedLogs = query({
  args: {
    clerkId: v.string(),
    clientUserId: v.string(), // The client's clerkId
    startDate: v.optional(v.number()), // Unix timestamp
    endDate: v.optional(v.number()), // Unix timestamp
    activityType: v.optional(v.string()), // "moods" | "journals" | "crisis" | "all"
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, { clerkId, clientUserId, startDate, endDate, activityType = "all", limit = 50, offset = 0 }) => {
    await requirePermission(ctx, clerkId, PERMISSIONS.VIEW_CLIENTS);

    const now = Date.now();
    const defaultStart = startDate || (now - 90 * 24 * 60 * 60 * 1000); // Last 90 days
    const defaultEnd = endDate || now;

    let allActivities: any[] = [];

    // Fetch moods - ONLY shared with support worker
    if (activityType === "all" || activityType === "moods") {
      const moods = await ctx.db
        .query("moods")
        .filter((q) => 
          q.and(
            q.eq(q.field("userId"), clientUserId),
            q.eq(q.field("shareWithSupportWorker"), true),
            q.gte(q.field("createdAt"), defaultStart),
            q.lte(q.field("createdAt"), defaultEnd)
          )
        )
        .collect();

      allActivities.push(...moods.map(m => ({
        _id: m._id,
        type: "mood" as const,
        moodType: m.moodType,
        intensity: m.intensity,
        notes: m.notes,
        factors: m.factors,
        shareWithSupportWorker: m.shareWithSupportWorker,
        createdAt: m.createdAt,
        emoji: m.moodEmoji,
        label: m.moodLabel,
      })));
    }

    // Fetch journals - ONLY shared with support worker
    if (activityType === "all" || activityType === "journals") {
      const journals = await ctx.db
        .query("journalEntries")
        .filter((q) => 
          q.and(
            q.eq(q.field("clerkId"), clientUserId),
            q.eq(q.field("shareWithSupportWorker"), true),
            q.gte(q.field("createdAt"), defaultStart),
            q.lte(q.field("createdAt"), defaultEnd)
          )
        )
        .collect();

      allActivities.push(...journals.map(j => ({
        _id: j._id,
        type: "journal" as const,
        title: j.title,
        content: j.content,
        emotionType: j.emotionType,
        tags: j.tags,
        shareWithSupportWorker: j.shareWithSupportWorker,
        createdAt: j.createdAt,
        emoji: j.emoji,
      })));
    }

    // Fetch crisis calls
    if (activityType === "all" || activityType === "crisis") {
      const crisisCalls = await ctx.db
        .query("activities")
        .filter((q) => 
          q.and(
            q.eq(q.field("userId"), clientUserId),
            q.eq(q.field("activityType"), "crisis_support"),
            q.gte(q.field("createdAt"), defaultStart),
            q.lte(q.field("createdAt"), defaultEnd)
          )
        )
        .collect();

      allActivities.push(...crisisCalls.map(c => ({
        _id: c._id,
        type: "crisis" as const,
        metadata: c.metadata,
        createdAt: c.createdAt,
      })));
    }

    // Sort by date descending
    allActivities.sort((a, b) => b.createdAt - a.createdAt);

    // Paginate
    const paginatedActivities = allActivities.slice(offset, offset + limit);

    return {
      activities: paginatedActivities,
      total: allActivities.length,
      hasMore: offset + limit < allActivities.length,
    };
  },
});

/**
 * Get AI-powered analytics and recommendations for a client
 */
export const getClientAnalytics = query({
  args: {
    clerkId: v.string(),
    clientUserId: v.string(),
  },
  handler: async (ctx, { clerkId, clientUserId }) => {
    await requirePermission(ctx, clerkId, PERMISSIONS.VIEW_CLIENTS);

    const now = Date.now();
    const last30Days = now - 30 * 24 * 60 * 60 * 1000;
    const last7Days = now - 7 * 24 * 60 * 60 * 1000;

    // Get all moods
    const allMoods = await ctx.db
      .query("moods")
      .filter((q) => q.eq(q.field("userId"), clientUserId))
      .collect();

    const recentMoods = allMoods.filter(m => m.createdAt >= last30Days);
    const weekMoods = allMoods.filter(m => m.createdAt >= last7Days);

    // Get crisis calls
    const crisisCalls = await ctx.db
      .query("activities")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), clientUserId),
          q.eq(q.field("activityType"), "crisis_support")
        )
      )
      .collect();

    const recentCrisis = crisisCalls.filter(c => c.createdAt >= last30Days);

    // Analyze mood patterns
    const moodScores = {
      "ecstatic": 5,
      "very-happy": 5,
      "happy": 4,
      "content": 4,
      "neutral": 3,
      "annoyed": 2,
      "sad": 2,
      "displeased": 2,
      "frustrated": 1,
      "very-sad": 1,
      "angry": 1,
      "furious": 1,
    };

    const avgMoodScore = recentMoods.length > 0
      ? recentMoods.reduce((sum, m) => sum + (moodScores[m.moodType] || 3), 0) / recentMoods.length
      : 3;

    const weekAvgScore = weekMoods.length > 0
      ? weekMoods.reduce((sum, m) => sum + (moodScores[m.moodType] || 3), 0) / weekMoods.length
      : 3;

    // Count negative moods
    const negativeMoods = recentMoods.filter(m => 
      ["frustrated", "very-sad", "angry", "furious", "sad", "displeased"].includes(m.moodType)
    );

    // Analyze factors
    const allFactors: { [key: string]: number } = {};
    const factorsByMood: { [key: string]: string[] } = {}; // Track which factors appear with which moods
    recentMoods.forEach(m => {
      (m.factors || []).forEach((f: string) => {
        allFactors[f] = (allFactors[f] || 0) + 1;
        if (!factorsByMood[m.moodType]) factorsByMood[m.moodType] = [];
        if (!factorsByMood[m.moodType].includes(f)) factorsByMood[m.moodType].push(f);
      });
    });
    const topFactors = Object.entries(allFactors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([factor, count]) => ({ factor, count }));

    // Engagement metrics
    const sharedCount = allMoods.filter(m => m.shareWithSupportWorker).length;
    const shareRate = allMoods.length > 0 ? (sharedCount / allMoods.length) * 100 : 0;

    // Analyze mood variability and patterns
    const moodCounts: { [key: string]: number } = {};
    recentMoods.forEach(m => {
      moodCounts[m.moodType] = (moodCounts[m.moodType] || 0) + 1;
    });

    // Check for mood swings (rapid changes)
    let moodSwings = 0;
    for (let i = 1; i < recentMoods.length; i++) {
      const prev = moodScores[recentMoods[i - 1].moodType] || 3;
      const curr = moodScores[recentMoods[i].moodType] || 3;
      if (Math.abs(prev - curr) >= 2) moodSwings++;
    }

    // Analyze notes for concerning content
    const concerningKeywords = ["suicidal", "suicide", "self-harm", "harm myself", "end it", "give up", "hopeless", "worthless", "can't go on"];
    const moodsWithConcerns = recentMoods.filter(m => 
      m.notes && concerningKeywords.some(keyword => m.notes!.toLowerCase().includes(keyword))
    );

    // Check for consistency of negative patterns
    const consecutiveNegativeDays: string[][] = [];
    let currentStreak: string[] = [];
    recentMoods.forEach(m => {
      if (["frustrated", "very-sad", "angry", "furious", "sad", "displeased"].includes(m.moodType)) {
        currentStreak.push(m.moodType);
      } else if (currentStreak.length >= 3) {
        consecutiveNegativeDays.push([...currentStreak]);
        currentStreak = [];
      } else {
        currentStreak = [];
      }
    });
    if (currentStreak.length >= 3) consecutiveNegativeDays.push(currentStreak);

    // Generate risk level with enhanced analysis
    let riskLevel: "low" | "moderate" | "high" | "critical" = "low";
    let riskFactors: string[] = [];

    if (moodsWithConcerns.length > 0) {
      riskLevel = "critical";
      riskFactors.push(`⚠️ CRISIS ALERT: ${moodsWithConcerns.length} entries contain concerning language about self-harm or suicidal ideation`);
    } else if (recentCrisis.length > 0) {
      riskLevel = "critical";
      riskFactors.push(`${recentCrisis.length} crisis call(s) in last 30 days - indicates acute distress`);
    } else if (negativeMoods.length >= 15) {
      riskLevel = "high";
      riskFactors.push(`Predominantly negative mood pattern: ${negativeMoods.length} negative entries out of ${recentMoods.length} total (${Math.round((negativeMoods.length/recentMoods.length)*100)}%)`);
    } else if (avgMoodScore < 2.5) {
      riskLevel = "high";
      riskFactors.push(`Persistently low emotional state: average mood score ${avgMoodScore.toFixed(1)}/5 over 30 days`);
    } else if (negativeMoods.length >= 10) {
      riskLevel = "high";
      riskFactors.push(`Significant negative mood frequency: ${negativeMoods.length} negative entries in last 30 days`);
    } else if (consecutiveNegativeDays.length > 0) {
      riskLevel = "moderate";
      riskFactors.push(`${consecutiveNegativeDays.length} period(s) of consecutive negative moods detected - may indicate sustained distress`);
    } else if (negativeMoods.length >= 5) {
      riskLevel = "moderate";
      riskFactors.push(`${negativeMoods.length} negative moods in last 30 days - monitor for escalation`);
    }

    if (weekAvgScore < avgMoodScore - 0.5) {
      riskFactors.push(`Recent mood decline: Last 7 days avg (${weekAvgScore.toFixed(1)}) significantly lower than 30-day avg (${avgMoodScore.toFixed(1)})`);
      if (riskLevel === "low") riskLevel = "moderate";
      if (riskLevel === "moderate" && weekAvgScore < 2) riskLevel = "high";
    }

    if (moodSwings >= 5) {
      riskFactors.push(`High mood instability: ${moodSwings} significant mood swings observed (±2 points or more)`);
      if (riskLevel === "low") riskLevel = "moderate";
    }

    if (recentMoods.length < 3 && allMoods.length > 0) {
      riskFactors.push("⚠️ Low recent engagement - client has gone quiet, may need proactive check-in");
    } else if (recentMoods.length === 0) {
      riskFactors.push("⚠️ No mood tracking activity in 30 days - client may be disengaged or in crisis");
      if (riskLevel === "low") riskLevel = "moderate";
    }

    if (shareRate < 30 && recentMoods.length >= 5) {
      riskFactors.push(`Low sharing rate (${Math.round(shareRate)}%) - client may be withholding information or feeling disconnected`);
    }

    // Generate comprehensive, actionable recommendations
    const recommendations: string[] = [];

    if (moodsWithConcerns.length > 0) {
      recommendations.push("🚨 IMMEDIATE ACTION REQUIRED: Contact client ASAP to assess suicide risk. Review concerning entries and activate crisis protocol");
      recommendations.push("Conduct comprehensive safety assessment. Discuss safety planning, remove means, and involve crisis team if necessary");
      recommendations.push("Document all entries with concerning language. Consider hospitalization or intensive outpatient program");
    } else if (riskLevel === "critical") {
      recommendations.push("⚠️ URGENT: Schedule immediate follow-up call within 24 hours to assess current safety and functioning");
      recommendations.push("Review all crisis call details thoroughly. Identify triggers, warning signs, and protective factors");
      recommendations.push("Develop or update crisis safety plan with specific coping strategies, emergency contacts, and when to use crisis resources");
      recommendations.push("Consider increasing frequency of check-ins to 2-3x weekly until stabilization");
    }

    if (riskLevel === "high") {
      recommendations.push("Schedule in-person session within 48 hours to conduct comprehensive mental health assessment");
      recommendations.push("Evaluate need for medication review, psychiatric consultation, or higher level of care");
      recommendations.push("Assess social support system and daily functioning (sleep, appetite, work/school performance)");
    }

    if (consecutiveNegativeDays.length > 0) {
      recommendations.push(`Address sustained negative mood periods: ${consecutiveNegativeDays.length} streak(s) of 3+ consecutive negative days identified. Explore environmental factors, life stressors, or underlying depression`);
    }

    if (negativeMoods.length >= 5 && topFactors.length > 0) {
      const topThreeFactors = topFactors.slice(0, 3).map(f => `${f.factor} (${f.count}x)`).join(", ");
      recommendations.push(`Deep dive into recurring mood triggers: Top factors are ${topThreeFactors}. Develop specific coping strategies for each`);
      
      // Provide factor-specific recommendations
      topFactors.slice(0, 3).forEach(f => {
        const moods = factorsByMood[Object.keys(factorsByMood).find(m => factorsByMood[m].includes(f.factor)) || ""] || [];
        if (f.factor.toLowerCase().includes("work") || f.factor.toLowerCase().includes("school")) {
          recommendations.push(`Work/school stress identified (${f.count} mentions): Explore work-life balance, time management skills, and boundary-setting with supervisors/teachers`);
        } else if (f.factor.toLowerCase().includes("family") || f.factor.toLowerCase().includes("relationship")) {
          recommendations.push(`Relationship strain detected (${f.count} mentions): Consider family/couples therapy, communication skills training, or conflict resolution strategies`);
        } else if (f.factor.toLowerCase().includes("sleep") || f.factor.toLowerCase().includes("tired")) {
          recommendations.push(`Sleep issues noted (${f.count} mentions): Assess for sleep disorders. Recommend sleep hygiene education, circadian rhythm regulation, possible sleep study`);
        } else if (f.factor.toLowerCase().includes("financial") || f.factor.toLowerCase().includes("money")) {
          recommendations.push(`Financial stress present (${f.count} mentions): Connect with financial counseling resources, budgeting tools, or social services support`);
        }
      });
    }

    if (moodSwings >= 5) {
      recommendations.push(`Address mood instability (${moodSwings} significant swings): Screen for bipolar spectrum, emotional dysregulation, or environmental stressors. Consider DBT skills for emotion regulation`);
    }

    if (weekAvgScore < avgMoodScore - 0.5) {
      recommendations.push(`Recent decline requires attention: Investigate what changed in the past week (life events, medication changes, seasonal factors, sleep disruption)`);
    }

    if (recentMoods.length < 3 && allMoods.length > 0) {
      recommendations.push("Client engagement dropping: Reach out to check if they're struggling too much to track, lost motivation, or experiencing app barriers. Offer support re-engaging with self-monitoring");
    } else if (recentMoods.length === 0) {
      recommendations.push("⚠️ Complete disengagement: Priority outreach needed. Client may be in crisis, burned out, or feeling hopeless. Use multiple contact methods (call, text, home visit if appropriate)");
    }

    if (shareRate < 30 && recentMoods.length >= 5) {
      recommendations.push(`Low sharing indicates possible trust barriers: Explore therapeutic relationship, confidentiality concerns, shame/stigma, or fear of judgment. Rebuild rapport`);
    }

    if (recentMoods.length >= 10 && avgMoodScore >= 3.5 && negativeMoods.length <= 3) {
      recommendations.push("✅ Client showing positive mood patterns: Reinforce current coping strategies. Explore what's working well to maintain gains. Consider gradual reduction in session frequency");
      recommendations.push("Continue current support approach: Client is actively engaging and maintaining mood stability. Monitor for maintenance of progress");
    }

    if (recommendations.length === 0) {
      recommendations.push("Client appears stable: Continue regular check-ins and maintain current support level");
      recommendations.push("Encourage continued mood tracking to identify early warning signs of any changes");
    }

    // Trend analysis
    const trend = weekAvgScore > avgMoodScore + 0.3 ? "improving" 
                : weekAvgScore < avgMoodScore - 0.3 ? "declining" 
                : "stable";

    return {
      riskLevel,
      riskFactors,
      recommendations,
      metrics: {
        totalMoods: allMoods.length,
        recentMoods: recentMoods.length,
        sharedMoods: sharedCount,
        shareRate: Math.round(shareRate),
        avgMoodScore: Number(avgMoodScore.toFixed(2)),
        weekAvgScore: Number(weekAvgScore.toFixed(2)),
        trend,
        negativeMoodCount: negativeMoods.length,
        crisisCallCount: crisisCalls.length,
        recentCrisisCount: recentCrisis.length,
        moodSwings,
        consecutiveNegativeStreaks: consecutiveNegativeDays.length,
      },
      topFactors,
      moodDistribution: Object.entries(moodCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count),
    };
  },
});

/**
 * Get journal analytics for a client
 */
export const getJournalAnalytics = query({
  args: {
    clerkId: v.string(),
    clientUserId: v.string(),
  },
  handler: async (ctx, { clerkId, clientUserId }) => {
    await requirePermission(ctx, clerkId, PERMISSIONS.VIEW_CLIENTS);

    const now = Date.now();
    const last30Days = now - 30 * 24 * 60 * 60 * 1000;
    const last7Days = now - 7 * 24 * 60 * 60 * 1000;

    // Get all journals using clerkId (the clientUserId is already a clerkId)
    const allJournals = await ctx.db
      .query("journalEntries")
      .filter((q) => q.eq(q.field("clerkId"), clientUserId))
      .collect();

    const recentJournals = allJournals.filter(j => j.createdAt >= last30Days);
    const last7DaysJournals = allJournals.filter(j => j.createdAt >= last7Days);

    // Analyze engagement metrics
    const sharedJournals = allJournals.filter(j => j.shareWithSupportWorker === true);
    const shareRate = allJournals.length > 0 ? (sharedJournals.length / allJournals.length) * 100 : 0;
    
    // Calculate word count from content
    const avgWordsPerEntry = recentJournals.length > 0
      ? Math.round(recentJournals.reduce((sum, j) => sum + (j.content?.split(/\s+/).length || 0), 0) / recentJournals.length)
      : 0;

    // Analyze themes from tags and emotion type
    const themeCounts: { [key: string]: number } = {};
    const emotionCounts: { [key: string]: number } = {};
    const concerningKeywords = ["suicidal", "suicide", "self-harm", "harm myself", "end it", "give up", "hopeless", "worthless", "can't go on"];
    
    let journalsWithConcerns = 0;
    recentJournals.forEach(j => {
      (j.tags || []).forEach((tag: string) => {
        themeCounts[tag] = (themeCounts[tag] || 0) + 1;
      });
      
      if (j.emotionType) {
        emotionCounts[j.emotionType] = (emotionCounts[j.emotionType] || 0) + 1;
      }

      if (j.content && concerningKeywords.some(keyword => j.content.toLowerCase().includes(keyword))) {
        journalsWithConcerns++;
      }
    });

    // Get top themes
    const topThemes = Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([theme, count]) => ({ theme, count }));

    // Analyze emotion trend (using emotionType as sentiment indicator)
    const negativeEmotions = ["frustrated", "sad", "angry", "anxious", "depressed", "overwhelmed"];
    const positiveEmotions = ["happy", "content", "grateful", "excited", "peaceful", "calm"];
    
    const negativeCount = recentJournals.filter(j => 
      negativeEmotions.some(e => j.emotionType?.toLowerCase().includes(e))
    ).length;
    
    const positiveCount = recentJournals.filter(j => 
      positiveEmotions.some(e => j.emotionType?.toLowerCase().includes(e))
    ).length;

    const sentimentScore = positiveCount * 1 + negativeCount * -1;
    const avgSentiment = recentJournals.length > 0 ? sentimentScore / recentJournals.length : 0;

    // Check engagement consistency
    const recentEngagementDays = new Set(recentJournals.map(j => 
      new Date(j.createdAt).toDateString()
    )).size;

    // Track previous 7 days engagement
    const previous7DaysStart = last7Days - 7 * 24 * 60 * 60 * 1000;
    const previous7DaysJournals = allJournals.filter(j => 
      j.createdAt >= previous7DaysStart && j.createdAt < last7Days
    );

    // Generate risk level
    let riskLevel: "low" | "moderate" | "high" | "critical" = "low";
    let riskFactors: string[] = [];

    if (journalsWithConcerns > 0) {
      riskLevel = "critical";
      riskFactors.push(`🚨 CRISIS ALERT: ${journalsWithConcerns} journal entry(ies) contain concerning language about self-harm or suicidal ideation`);
    } else if (recentJournals.length === 0) {
      riskLevel = "moderate";
      riskFactors.push("⚠️ No journaling activity in last 30 days - client may be disengaged or struggling to express emotions");
    } else if (recentJournals.length < 3) {
      riskLevel = "moderate";
      riskFactors.push(`Low journaling frequency: Only ${recentJournals.length} entries in 30 days - may indicate avoidance or emotional suppression`);
    } else if (negativeCount >= recentJournals.length * 0.6) {
      riskLevel = "high";
      riskFactors.push(`Predominantly negative journaling: ${Math.round((negativeCount / recentJournals.length) * 100)}% of entries show negative emotion`);
    } else if (avgSentiment < -0.3) {
      riskLevel = "moderate";
      riskFactors.push(`Negative sentiment trend: Recent entries lean negative - suggests emotional distress or processing difficult experiences`);
    }

    if (recentEngagementDays <= 2 && recentJournals.length > 0) {
      riskFactors.push(`⚠️ Low engagement consistency: Entries compressed into ${recentEngagementDays} day(s) only - may indicate crisis-driven journaling rather than regular reflection`);
      if (riskLevel === "low") riskLevel = "moderate";
    }

    if (shareRate < 20 && allJournals.length >= 5) {
      riskFactors.push(`Low sharing rate (${Math.round(shareRate)}%) - client may not feel safe or connected with support worker`);
    }

    if (avgWordsPerEntry < 50 && recentJournals.length >= 3) {
      riskFactors.push(`Brief entries (avg ${avgWordsPerEntry} words) - may indicate limited emotional expression or superficial journaling`);
    }

    // Generate recommendations
    const recommendations: string[] = [];

    if (journalsWithConcerns > 0) {
      recommendations.push("🚨 IMMEDIATE ACTION REQUIRED: Review concerning journal entries immediately. Assess suicide risk and activate crisis protocol");
      recommendations.push("Schedule urgent crisis assessment. Discuss safety planning and consider hospitalization if risk is imminent");
      recommendations.push("Increase monitoring frequency to daily check-ins until safety is assured");
    }

    if (recentJournals.length === 0) {
      recommendations.push("⚠️ Priority outreach: Client has stopped journaling. Reach out to check on their wellbeing and re-engage with self-reflection practices");
      recommendations.push("Explore barriers to journaling: Ask if app is hard to use, they lack privacy, or emotional avoidance is occurring");
      recommendations.push("Consider alternative expression methods: art, music, voice notes, or guided journaling prompts if traditional writing feels blocked");
    } else if (recentJournals.length < 3) {
      recommendations.push(`Encourage regular journaling habit: Current frequency is low (${recentJournals.length} entries/month). Recommend daily 5-10 minute practice`);
      recommendations.push("Set specific journaling routine: Suggest consistent time (morning reflection, evening gratitude, or weekly deep dive) to build consistency");
    }

    if (negativeCount >= recentJournals.length * 0.6) {
      recommendations.push("Address predominant negative themes: Explore what's driving recurring negative thoughts. Consider CBT/DBT interventions for thought patterns");
      recommendations.push("Balance reflection with wellbeing: Suggest adding gratitude practice or positive experiences to journaling routine");
    }

    if (topThemes.length > 0) {
      const topThemesList = topThemes.slice(0, 3).map(t => `${t.theme} (${t.count}x)`).join(", ");
      recommendations.push(`Key themes identified: ${topThemesList}. Develop targeted interventions addressing these recurring life domains`);
      
      // Theme-specific recommendations
      topThemes.slice(0, 3).forEach(t => {
        if (t.theme.toLowerCase().includes("work") || t.theme.toLowerCase().includes("job") || t.theme.toLowerCase().includes("career")) {
          recommendations.push(`Work-related stress prominent: Explore workplace dynamics, work-life balance, and career goals. Consider workplace accommodations or job counseling`);
        } else if (t.theme.toLowerCase().includes("relationship") || t.theme.toLowerCase().includes("family") || t.theme.toLowerCase().includes("friend")) {
          recommendations.push(`Relationship issues recurring theme: Address communication patterns, boundaries, and attachment concerns. Recommend relationship counseling if applicable`);
        } else if (t.theme.toLowerCase().includes("health") || t.theme.toLowerCase().includes("anxiety") || t.theme.toLowerCase().includes("depression")) {
          recommendations.push(`Mental/physical health concerns noted: Ensure medical and psychiatric needs are addressed. Monitor for symptom escalation`);
        } else if (t.theme.toLowerCase().includes("finances") || t.theme.toLowerCase().includes("money")) {
          recommendations.push(`Financial stress documented: Connect client with financial counseling, budgeting resources, or assistance programs`);
        }
      });
    }

    if (recentEngagementDays <= 2 && recentJournals.length > 0) {
      recommendations.push("Spread journaling over time: Encourage small, frequent entries rather than bulk entries. This creates accountability and improves insight");
    }

    if (shareRate < 20 && allJournals.length >= 5) {
      recommendations.push(`Build trust and sharing: Current low sharing rate suggests safety concerns. Explore fears about judgment and rebuild therapeutic alliance`);
      recommendations.push("Explain confidentiality clearly: Ensure client understands what gets shared, with whom, and how it will be used");
    }

    if (avgWordsPerEntry < 50 && recentJournals.length >= 3) {
      recommendations.push("Deepen journaling practice: Encourage more detailed exploration. Use prompts like 'Why did that situation upset me?' or 'What am I avoiding feeling?'");
    }

    if (last7DaysJournals.length > previous7DaysJournals.length) {
      recommendations.push("✅ Positive engagement trend: Client is journaling more recently. Reinforce this habit and explore what motivated the increase");
    }

    if (recentJournals.length >= 10 && Math.abs(avgSentiment) < 0.2) {
      recommendations.push("✅ Client showing balanced emotional processing: Good mix of reflective entries. Continue current journaling support");
    }

    if (recommendations.length === 0) {
      recommendations.push("Client journaling appears adequate: Maintain current support and encourage continued self-reflection");
      recommendations.push("Monitor journal themes for early warning signs of deterioration in emotional state");
    }

    // Trend analysis
    const trend = last7DaysJournals.length > previous7DaysJournals.length 
      ? "improving"
      : last7DaysJournals.length < previous7DaysJournals.length 
      ? "declining"
      : "stable";

    return {
      riskLevel,
      riskFactors,
      recommendations,
      metrics: {
        totalJournals: allJournals.length,
        recentJournals: recentJournals.length,
        sharedJournals: sharedJournals.length,
        shareRate: Math.round(shareRate),
        avgWordsPerEntry,
        trend,
        engagementDays: recentEngagementDays,
        avgSentiment: Number(avgSentiment.toFixed(2)),
        negativeEntries: negativeCount,
        positiveEntries: positiveCount,
        neutralEntries: recentJournals.length - negativeCount - positiveCount,
      },
      topThemes,
      engagementTrend: {
        last7Days: last7DaysJournals.length,
        previous7Days: previous7DaysJournals.length,
        trend,
      },
    };
  },
});

/**
 * Get crisis support analytics for a client
 */
export const getCrisisAnalytics = query({
  args: {
    clerkId: v.string(),
    clientUserId: v.string(),
  },
  handler: async (ctx, { clerkId, clientUserId }) => {
    await requirePermission(ctx, clerkId, PERMISSIONS.VIEW_CLIENTS);

    const now = Date.now();
    const last30Days = now - 30 * 24 * 60 * 60 * 1000;
    const last7Days = now - 7 * 24 * 60 * 60 * 1000;

    // Get all crisis calls/activities
    const allCrisis = await ctx.db
      .query("activities")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), clientUserId),
          q.eq(q.field("activityType"), "crisis_support")
        )
      )
      .collect();

    const recentCrisis = allCrisis.filter(c => c.createdAt >= last30Days);
    const last7DaysCrisis = allCrisis.filter(c => c.createdAt >= last7Days);
    const last24HoursCrisis = allCrisis.filter(c => c.createdAt >= (now - 24 * 60 * 60 * 1000));

    // Determine risk level
    let riskLevel = 'low';
    let riskFactors: string[] = [];

    if (last24HoursCrisis.length > 0) {
      riskLevel = 'critical';
      riskFactors.push(`Crisis support needed in last 24 hours (${last24HoursCrisis.length} incident${last24HoursCrisis.length !== 1 ? 's' : ''})`);
    } else if (last7DaysCrisis.length > 0) {
      riskLevel = 'high';
      riskFactors.push(`Multiple crisis incidents in past 7 days (${last7DaysCrisis.length})`);
    } else if (recentCrisis.length > 1) {
      riskLevel = 'moderate';
      riskFactors.push(`Recurring crisis patterns: ${recentCrisis.length} incidents in 30 days`);
    }

    // Analyze crisis frequency pattern
    const crisisFrequency = recentCrisis.length > 0 ? (recentCrisis.length / 30).toFixed(2) : '0';
    
    // Get crisis reasons/categories from metadata
    const crisisReasons: Record<string, number> = {};
    for (const crisis of recentCrisis) {
      const reason = crisis.metadata?.reason || 'unspecified';
      crisisReasons[reason] = (crisisReasons[reason] || 0) + 1;
    }

    // Generate recommendations
    const recommendations: string[] = [];

    if (last24HoursCrisis.length > 0) {
      recommendations.push('🚨 URGENT: Immediate follow-up session required');
      recommendations.push('Assess current safety and suicide/harm risk');
      recommendations.push('Consider psychiatric evaluation or hospitalization if needed');
      recommendations.push('Activate crisis support plan and emergency contacts');
    } else if (last7DaysCrisis.length > 0) {
      recommendations.push('Schedule priority session within 24-48 hours');
      recommendations.push('Review and strengthen crisis coping strategies');
      recommendations.push('Ensure crisis resources and hotline numbers are accessible');
      recommendations.push('Coordinate with psychiatry/medical team if applicable');
    } else if (recentCrisis.length > 1) {
      recommendations.push('Discuss crisis triggers during next session');
      recommendations.push('Develop stronger early warning system for client');
      recommendations.push('Teach distress tolerance and emotion regulation skills');
      recommendations.push('Build comprehensive safety plan with specific coping steps');
    } else if (allCrisis.length === 0) {
      recommendations.push('Client has no crisis history - continue regular support');
      recommendations.push('Teach proactive coping skills to maintain stability');
    }

    // Get crisis trend
    const prev7DaysCrisisCount = allCrisis.filter(c => 
      c.createdAt >= (last7Days - 7 * 24 * 60 * 60 * 1000) && 
      c.createdAt < last7Days
    ).length;

    let trend = 'stable';
    if (last7DaysCrisis.length > prev7DaysCrisisCount * 1.2) trend = 'increasing';
    else if (last7DaysCrisis.length < prev7DaysCrisisCount * 0.8) trend = 'decreasing';

    // Get top crisis reasons
    const topReasons = Object.entries(crisisReasons)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([reason, count]) => ({ reason, count }));

    return {
      riskLevel,
      riskFactors,
      recommendations,
      metrics: {
        totalCrisisCalls: allCrisis.length,
        crisisInLast30Days: recentCrisis.length,
        crisisInLast7Days: last7DaysCrisis.length,
        crisisInLast24Hours: last24HoursCrisis.length,
        crisisFrequency: parseFloat(crisisFrequency),
        trend,
      },
      topReasons,
      timeline: {
        last24Hours: last24HoursCrisis.length,
        last7Days: last7DaysCrisis.length,
        last30Days: recentCrisis.length,
        allTime: allCrisis.length,
      },
    };
  },
});
