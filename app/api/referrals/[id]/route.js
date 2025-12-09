/**
 * File: app/api/referrals/[id]/route.js
 * Purpose: Handle API routes for fetching, updating, and deleting a specific referral record by ID.
 * Updated to use Convex instead of Prisma for data storage.
 * 
 * Reference: Comments and documentation in this file were added with assistance from ChatGPT (OpenAI, 2025)
 */

import { auth, currentUser } from "@clerk/nextjs/server";  // Clerk authentication helpers
import { NextResponse } from "next/server";                // Used to create HTTP responses in Next.js
import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/convex-server.js";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

// Helper to map Convex camelCase fields to snake_case expected by frontend
function mapReferralToSnakeCase(referral) {
  return {
    _id: referral._id,
    id: referral._id, // Keep both for backwards compatibility
    client_id: referral.clientId,
    client_first_name: referral.clientFirstName,
    client_last_name: referral.clientLastName,
    age: referral.age,
    phone: referral.phone,
    email: referral.email,
    address: referral.address,
    emergency_first_name: referral.emergencyFirstName,
    emergency_last_name: referral.emergencyLastName,
    emergency_phone: referral.emergencyPhone,
    referral_source: referral.referralSource,
    reason_for_referral: referral.reasonForReferral,
    additional_notes: referral.additionalNotes,
    submitted_date: referral.submittedDate,
    status: referral.status,
    processed_date: referral.processedDate,
    processed_by_user_id: referral.processedByUserId,
    updated_at: referral.updatedAt,
    created_at: referral.createdAt,
    orgId: referral.orgId,
  };
}

// Using shared getConvexClient from lib with robust Clerk token fallbacks

/**
 * =====================
 * GET /api/referrals/[id]
 * =====================
 * Fetch a specific referral record by its unique ID.
 */
export async function GET(req, context) {
  try {
    // Authentication and role check
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = user?.publicMetadata?.role;
    const allowedRoles = ["admin", "team_leader"];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { 
          error: "Forbidden - Access to referrals is restricted to Team Leaders and Administrators only",
          yourRole: role,
          allowedRoles: allowedRoles
        }, 
        { status: 403 }
      );
    }

    const { id } = await context.params; // Extracts referral ID from the route parameters
    
    const convex = await getConvexClient();
    const referral = await convex.query(api.referrals.list, {})
      .then(list => list.find(r => r._id === id));

    if (!referral)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Map to snake_case for frontend compatibility
    return NextResponse.json({ referral: mapReferralToSnakeCase(referral) });
  } catch (err) {
    console.error("GET /api/referrals/[id] error:", err);
    return NextResponse.json({ error: "Failed to fetch referral" }, { status: 500 });
  }
}

/**
 * =====================
 * PATCH /api/referrals/[id]
 * =====================
 * Update a referral record by ID.
 * Only the admin and team leader is authorized to perform this action.
 */
export async function PATCH(req, context) {
  try {
    const { id } = await context.params;              // Extracts the referral ID from route parameters
    const { userId } = await auth();          // Get the authenticated user's ID from Clerk
    const user = await currentUser();         // Fetch the full user details from Clerk
    
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check user role - only team leaders and admins can update referrals
    const role = user?.publicMetadata?.role;
    const allowedRoles = ["admin", "team_leader"];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { 
          error: "Forbidden - Access to referrals is restricted to Team Leaders and Administrators only",
          yourRole: role,
          allowedRoles: allowedRoles
        }, 
        { status: 403 }
      );
    }

    // Parse the request body for updated data
    const body = await req.json();

    const convex = await getConvexClient();

    // Update referral status using Convex mutation
    await convex.mutation(api.referrals.updateStatus, {
      referralId: id,
      status: body.status,
      processed_by_user_id: body.processed_by_user_id ? String(body.processed_by_user_id) : undefined,
    });

    // Fetch updated referral
    const updated = await convex.query(api.referrals.list, {})
      .then(list => list.find(r => r._id === id));

    if (!updated) {
      return NextResponse.json({ error: "Referral not found after update" }, { status: 404 });
    }

    // If the referral was accepted, create a client record in Convex
    if (body.status === 'accepted' && body.processed_by_user_id) {
      try {
        console.log("Creating client from accepted referral...");
        
        // Get the admin/team leader who accepted the referral to determine orgId
        const adminUser = await convex.query(api.users.getByClerkId, {
          clerkId: user.id,
        });

        console.log("Admin user:", adminUser);

        if (!adminUser) {
          console.error("❌ Admin user not found in Convex. User needs to be synced to Convex first.");
          throw new Error("Admin user not found in Convex database");
        }
        
        if (!adminUser.orgId) {
          console.error("❌ Admin user has no organization assigned. Please contact system administrator.");
          throw new Error("Admin user has no organization");
        }

        // Get the assigned user by their clerk ID
        const assignedUser = await convex.query(api.users.getByClerkId, {
          clerkId: user.id,
          targetClerkId: body.processed_by_user_id,
        });

        console.log("Assigned user:", assignedUser);

        // Ensure the client exists in Clerk so mobile forgot-password works
        const secret = process.env.CLERK_SECRET_KEY;
        if (!secret) throw new Error("CLERK_SECRET_KEY not configured");

        // Lookup by email
        const lookupRes = await fetch(`https://api.clerk.com/v1/users?email_address=${encodeURIComponent(updated.email)}`,
          { headers: { Authorization: `Bearer ${secret}` } });
        let clientClerkId;
        if (lookupRes.ok) {
          const existing = await lookupRes.json();
          if (Array.isArray(existing) && existing.length > 0) {
            clientClerkId = existing[0].id;
            console.log("Existing Clerk client found:", clientClerkId);
          }
        }

        // Create if missing
        if (!clientClerkId) {
          const generatePassword = () => {
            const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
            const lower = "abcdefghijkmnopqrstuvwxyz";
            const digits = "23456789";
            const symbols = "!@#$%^&*()_+[]{}";
            const pick = (set) => set[Math.floor(Math.random() * set.length)];
            let pwd = pick(upper) + pick(lower) + pick(digits) + pick(symbols);
            const all = upper + lower + digits + symbols;
            while (pwd.length < 16) pwd += pick(all);
            return pwd;
          };

          const tempPassword = generatePassword();
          const createBody = {
            email_address: [updated.email],
            password: tempPassword,
            first_name: updated.clientFirstName || undefined,
            last_name: updated.clientLastName || undefined,
            public_metadata: {
              role: "client",
              orgId: adminUser.orgId,
              invitedBy: user.id,
              source: "referral",
              mustChangePassword: true,
            },
          };

          const createRes = await fetch("https://api.clerk.com/v1/users", {
            method: "POST",
            headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
            body: JSON.stringify(createBody),
          });
          const createData = await createRes.json();
          if (!createRes.ok) {
            console.error("Clerk client creation failed:", createRes.status, createData);
            return NextResponse.json({
              error: createData?.errors?.[0]?.message || "Failed to create client in Clerk",
              detail: JSON.stringify(createData),
            }, { status: createRes.status || 500 });
          }
          clientClerkId = createData.id;
          console.log("New Clerk client created:", clientClerkId);
        }

        const clientData = {
          clerkId: user.id, // actor performing the creation
          clientClerkId,
          firstName: updated.clientFirstName,
          lastName: updated.clientLastName,
          email: updated.email,
          phone: updated.phone,
          address: updated.address,
          emergencyContactName: updated.emergencyFirstName ? `${updated.emergencyFirstName} ${updated.emergencyLastName || ''}`.trim() : undefined,
          emergencyContactPhone: updated.emergencyPhone,
          assignedUserId: assignedUser ? assignedUser.clerkId : body.processed_by_user_id, // Assign to the support worker
          orgId: adminUser.orgId, // Use the admin's organization
        };

        console.log("Creating client with data:", clientData);

        const clientId = await convex.mutation(api.clients.create, clientData);
        
        console.log("✅ Client created successfully with ID:", clientId);
      } catch (clientError) {
        console.error("❌ Error creating client from referral:", clientError);
        console.error("Error details:", clientError.message);
        // Return error so user knows client creation failed
        return NextResponse.json({ 
          error: "Failed to create client record", 
          details: clientError.message,
          referral: mapReferralToSnakeCase(updated) 
        }, { status: 500 });
      }
    }

    // Return the updated referral with snake_case mapping
    return NextResponse.json({ referral: mapReferralToSnakeCase(updated) });
  } catch (err) {
    console.error("PATCH /api/referrals/[id] error:", err);
    return NextResponse.json({ error: "Failed to update referral" }, { status: 500 });
  }
}

/**
 * =====================
 * DELETE /api/referrals/[id]
 * =====================
 * Delete a referral record by ID.
 * Only the referral creator or an admin is allowed to delete it.
 */
export async function DELETE(req, context) {
  try {
    const { id } = await context.params;              // Extract the referral ID from route parameters
    const { userId } = await auth();          // Verify if the user is authenticated
    const user = await currentUser();         // Fetch full user info from Clerk
    
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const convex = await getConvexClient();

    // Check if the referral exists
    const referral = await convex.query(api.referrals.list, {})
      .then(list => list.find(r => r._id === id));
      
    if (!referral)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Role-based access check
    const role = user?.publicMetadata?.role;
    const isAdmin = role === "admin";

    // Only admin can delete referrals (simplified for Convex)
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Note: Convex doesn't have a delete mutation for referrals yet
    // This would need to be implemented in convex/referrals.ts
    // For now, return a not implemented error
    return NextResponse.json({ error: "Delete not implemented yet" }, { status: 501 });
    
  } catch (err) {
    console.error("DELETE /api/referrals/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete referral" }, { status: 500 });
  }
}
