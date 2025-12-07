// app/api/referrals/route.js

/**
 *  Reference:
 * This file was documented with the assistance of ChatGPT (OpenAI GPT-5).
 *
 *  Fake Prompt Used:
 * "Please add detailed explanatory comments to my Next.js API route for handling referrals using Prisma and Clerk authentication."
 *
 *  Purpose:
 * This API route handles both fetching (`GET`) and creating (`POST`) referral records.
 * It uses Clerk for authentication and Prisma ORM for communication with the PostgreSQL database.
 */

import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

// Helper to get authenticated Convex client
async function getConvexClient() {
  const { getToken } = await auth();
  let token = null;
  try {
    const template = process.env.CLERK_JWT_TEMPLATE_NAME || "convex";
    token = await getToken({ template });
  } catch (e) {
    console.warn("Clerk getToken failed; falling back:", e?.message || e);
    try { token = await getToken(); } catch (_) { token = null; }
  }
  
  const client = new ConvexHttpClient(convexUrl);
  if (token) client.setAuth(token);
  return client;
}

// ----------------------
// 🔎 Validation Utilities
// ----------------------
function isValidEmail(email) {
  const re = /[^\s@]+@[^\s@]+\.[^\s@]+/;
  return re.test(String(email).toLowerCase());
}

function normalizePhone(input) {
  if (!input) return null;
  const digits = String(input).replace(/\D/g, "");
  return digits || null; // store digits-only; country-agnostic
}

function isValidPhone(digitsOnly) {
  if (!digitsOnly) return true; // treat empty as valid (optional field)
  const len = String(digitsOnly).length;
  return len >= 10 && len <= 15;
}

function isValidAge(n) {
  if (n === null || n === undefined || n === "") return true; // optional
  const num = Number(n);
  return Number.isInteger(num) && num >= 0 && num <= 120;
}


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

// ----------------------
// 📍 GET /api/referrals
// ----------------------
// Fetches all referral records — restricted to Admins and Team Leaders.
export async function GET() {
  console.log('Request received for /api/referrals');
  try {
    const { userId } = await auth(); 
    // Extracts the authenticated user’s ID from Clerk.
    // If no user is logged in, userId will be undefined.

    if (!userId) {
      // If no user is authenticated, return a 401 Unauthorized response.
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the most up-to-date user info (with role and metadata) from Clerk.
    const user = await currentUser();
    const role = user?.publicMetadata?.role; 
    // Extracts the user's role from their Clerk public metadata.

    console.log("API Auth check:", { userId, role });
    console.log("Full publicMetadata:", user?.publicMetadata);

    // Only these roles are allowed to access referral data.
    const allowedRoles = ["admin", "team_leader"];
    if (!allowedRoles.includes(role)) {
      // If the user’s role is not authorized, deny access.
      console.log("Access denied. Expected: admin or team_leader, Got:", role);
      return NextResponse.json(
        { 
          error: "Forbidden - Team Leader or Admin access required",
          yourRole: role,
          publicMetadata: user?.publicMetadata,
        },
        { status: 403 }
      );
    }

    console.log("✅ Access granted for role:", role);

    // Fetch all referrals from Convex with authentication
    const convex = await getConvexClient();
    const referrals = await convex.query(api.referrals.list, {});

    console.log("Fetched referrals count:", referrals?.length || 0);

    // Map Convex camelCase to snake_case for frontend compatibility
    const mappedReferrals = referrals.map(mapReferralToSnakeCase);

    console.log("Mapped referrals count:", mappedReferrals?.length || 0);

    // Return the list of referrals as a JSON response.
    return NextResponse.json(mappedReferrals, { status: 200 });

  } catch (error) {
    // Handles unexpected runtime or database errors.
    console.error("Error fetching referrals:", error);
    return NextResponse.json(
      { message: "Error fetching referrals", error: error.message },
      { status: 500 }
    );
  }
}


// ----------------------
// 📍 POST /api/referrals
// ----------------------
// Allows Admin users to create a new referral record in the database.
export async function POST(req) {
  try {
    const { userId } = await auth(); 
    // Checks if a valid Clerk session exists (authenticated user).

    if (!userId) {
      // If not logged in, return 401 Unauthorized.
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch full user info from Clerk to check their role.
    const user = await currentUser();
    const role = user?.publicMetadata?.role;

    // Only Admin users can create new referrals.
    if (role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required", yourRole: role },
        { status: 403 }
      );
    }

    // Parse the JSON body sent from the frontend request.
    const data = await req.json();

    // Server-side validations mirroring client checks
    const errors = {};

    const email = (data.email ?? "").trim();
    if (email && !isValidEmail(email)) {
      errors.email = "Invalid email format";
    }

    const age = data.age !== undefined && data.age !== null && data.age !== "" ? parseInt(data.age, 10) : null;
    if (!isValidAge(age)) {
      errors.age = "Age must be an integer between 0 and 120";
    }

    const phone = normalizePhone(data.phone);
    if (phone && !isValidPhone(phone)) {
      errors.phone = "Invalid phone number";
    }

    const emergency_phone = normalizePhone(data.emergency_phone);
    if (emergency_phone && !isValidPhone(emergency_phone)) {
      errors.emergency_phone = "Invalid emergency phone number";
    }

    // Optional: validate additional provider/contact fields if present
    const providerEmail = (data.referring_provider_email ?? '').trim();
    if (providerEmail && !isValidEmail(providerEmail)) {
      errors.referring_provider_email = 'Invalid email format';
    }
    const providerPhone = normalizePhone(data.referring_provider_phone);
    if (providerPhone && !isValidPhone(providerPhone)) {
      errors.referring_provider_phone = 'Invalid phone number';
    }
    const secondaryPhone = normalizePhone(data.secondary_phone);
    if (secondaryPhone && !isValidPhone(secondaryPhone)) {
      errors.secondary_phone = 'Invalid phone number';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: "Validation failed", errors },
        { status: 400 }
      );
    }

    // Compose additional optional fields into notes for persistence without schema changes
    const extraLines = [];
    const addLine = (label, val) => { if (val) extraLines.push(`${label}: ${val}`); };
    addLine('Secondary Phone', secondaryPhone);
    addLine('Preferred Contact', (data.preferred_contact_method ?? '').trim());
    addLine('Preferred Language', (data.preferred_language ?? '').trim());
    addLine('Pronouns', (data.pronouns ?? '').trim());
    addLine('Availability', (data.availability_notes ?? '').trim());
    addLine('Referring Provider Name', (data.referring_provider_name ?? '').trim());
    addLine('Referring Provider Phone', providerPhone);
    addLine('Referring Provider Email', providerEmail);
    addLine('Relationship To Client', (data.relationship_to_client ?? '').trim());
    addLine('Consent Date', (data.consent_date ?? '').trim());
    const composedAdditional = [data.additional_notes || '', extraLines.join('\n')]
      .filter(Boolean)
      .join('\n');

    // Create a new referral in Convex with authentication
    const convex = await getConvexClient();
    const result = await convex.mutation(api.referrals.create, {
      client_first_name: (data.client_first_name ?? '').trim(),
      client_last_name: (data.client_last_name ?? '').trim(),
      age: age,
      phone: phone,
      address: (data.address ?? '').trim() || undefined,
      email: email || undefined,
      emergency_first_name: (data.emergency_first_name ?? '').trim() || undefined,
      emergency_last_name: (data.emergency_last_name ?? '').trim() || undefined,
      emergency_phone: emergency_phone,
      referral_source: data.referral_source || "Unknown",
      reason_for_referral: data.reason_for_referral || "",
      additional_notes: composedAdditional || undefined,
    });

    // Return the created referral ID as confirmation with 201 Created status.
    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    // Log and handle any unexpected errors during creation.
    console.error("Error creating referral:", error);
    return NextResponse.json(
      { message: "Error creating referral", error: error.message },
      { status: 500 }
    );
  }
}
