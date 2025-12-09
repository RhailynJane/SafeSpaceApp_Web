import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

/**
 * Helper function to map Convex client data to frontend snake_case format
 */
function mapClientToSnakeCase(client) {
  return {
    _id: client._id,
    id: client._id,
    client_first_name: client.firstName,
    client_last_name: client.lastName,
    first_name: client.firstName,
    last_name: client.lastName,
    email: client.email,
    phone: client.phone,
    address: client.address,
    date_of_birth: client.dateOfBirth,
    gender: client.gender,
    pronouns: client.pronouns,
    primary_language: client.primaryLanguage,
    mental_health_concerns: client.mentalHealthConcerns,
    support_needed: client.supportNeeded,
    ethnocultural_background: client.ethnoculturalBackground,
    emergency_contact_name: client.emergencyContactName,
    emergency_contact_phone: client.emergencyContactPhone,
    emergency_contact_relationship: client.emergencyContactRelationship,
    status: client.status,
    risk_level: client.riskLevel,
    assigned_user_id: client.assignedUserId,
    org_id: client.orgId,
    last_session_date: client.lastSessionDate,
    created_at: client.createdAt,
    updated_at: client.updatedAt,
  };
}

/**
 * PATCH /api/clients/[id]
 * Update a client's profile
 */
export async function PATCH(request, context) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    console.log("Updating client with ID:", id);
    console.log("Update data:", body);

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
    }

    const convex = new ConvexHttpClient(convexUrl);

    // Map snake_case frontend data to camelCase for Convex
    const updateData = {
      clerkId: userId,
      clientId: id, // Convex will validate this is a proper ID
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      address: body.address,
      dateOfBirth: body.dateOfBirth,
      gender: body.gender,
      pronouns: body.pronouns,
      primaryLanguage: body.primaryLanguage,
      mentalHealthConcerns: body.mentalHealthConcerns,
      supportNeeded: body.supportNeeded,
      ethnoculturalBackground: body.ethnoculturalBackground,
      riskLevel: body.riskLevel,
      status: body.status,
      emergencyContactName: body.emergencyContactName,
      emergencyContactPhone: body.emergencyContactPhone,
      emergencyContactRelationship: body.emergencyContactRelationship,
    };

    console.log("Calling Convex mutation with:", updateData);

    // Call the Convex mutation to update the client
    const updatedClient = await convex.mutation(api.clients.update, updateData);

    console.log("Client updated successfully:", updatedClient);

    // Map the response back to snake_case
    return NextResponse.json(mapClientToSnakeCase(updatedClient), { status: 200 });

  } catch (error) {
    console.error("Error updating client:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { message: "Error updating client", error: error.message },
      { status: 500 }
    );
  }
}
