// app/api/clients/route.js
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/clients
 * Returns a list of all clients, ignoring user role
 */
export async function GET(req) {
  try {
    // Step 1: Authenticate via Clerk
    const { userId: clerkUserId } = await getAuth(req);
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Step 2: Optional: log the authenticated user
    console.log("✅ Authenticated Clerk ID:", clerkUserId);

    // Step 3: Fetch all clients with their assigned user info
    const clients = await prisma.client.findMany({
      orderBy: { created_at: "desc" },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

        include: {

          role: true,

        },

      });

    }



    if (!user.role) {

      return NextResponse.json({ error: `User with clerk_user_id ${userId} has an invalid role_id.` }, { status: 500 });

    }



    const userRole = user.role.role_name.replace(/_/g, "-");





    let clients;

    if (userRole === "support-worker") {

      clients = await prisma.client.findMany({
        select: {
          id: true,
          client_first_name: true,
          client_last_name: true,
          last_session_date: true,
          risk_level: true,
          status: true,
          email: true,
          user: {
            select: {
              clerk_user_id: true,
            },
          },
        },
      });

    } else {

      clients = await prisma.client.findMany({

        orderBy: { created_at: "desc" },
        select: {
          id: true,
          client_first_name: true,
          client_last_name: true,
          last_session_date: true,
          risk_level: true,
          status: true,
          email: true,
          user: {
            select: {
              clerk_user_id: true,
            },
          },
        },
      });

    }



    return NextResponse.json(clients, { status: 200 });

  } catch (error) {
    console.error("❌ Error fetching clients:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
