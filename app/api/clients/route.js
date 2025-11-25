import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getConvexClient } from "@/lib/convex-provider";
import { api } from "@/convex/_generated/api";

/**
 * Helper function to map Convex client data to frontend snake_case format
 */
function mapClientToSnakeCase(client) {
  return {
    _id: client._id,
    id: client._id, // For backwards compatibility
    client_first_name: client.firstName,
    client_last_name: client.lastName,
    first_name: client.firstName,
    last_name: client.lastName,
    email: client.email,
    phone: client.phone,
    address: client.address,
    date_of_birth: client.dateOfBirth,
    gender: client.gender,
    emergency_contact_name: client.emergencyContactName,
    emergency_contact_phone: client.emergencyContactPhone,
    status: client.status,
    risk_level: client.riskLevel,
    assigned_user_id: client.assignedUserId,
    org_id: client.orgId,
    last_session_date: client.lastSessionDate,
    created_at: client.createdAt,
    updated_at: client.updatedAt,
  };
}

export async function GET(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const convex = await getConvexClient();

    // Fetch clients from Convex using the list query
    const clients = await convex.query(api.clients.list, {
      clerkId: userId,
    });

    // Map Convex clients to snake_case format for frontend compatibility
    const mappedClients = clients.map(mapClientToSnakeCase);

    return NextResponse.json(mappedClients, { status: 200 });

  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { message: "Error fetching clients", error: error.message },
      { status: 500 }
    );
  }
}
