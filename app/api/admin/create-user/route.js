// app/api/admin/create-user/route.js
/**
 * @file This API route handles the creation of a new user.
 * It is an admin-only endpoint.
 *
 * The process involves three main steps:
 * 1. Verify that the user making the request is an administrator.
 * 2. Create the user in the Clerk authentication service.
 * 3. If the Clerk user is created successfully, insert the user's data into the local PostgreSQL database.
 *
 * If the database insertion fails, a rollback mechanism is triggered to delete the newly created user from Clerk
 * to maintain data consistency between the two systems.
 */
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from '@/lib/prisma';

export async function POST(req) {
  console.log('Create-user endpoint called');

  // 1) Verify the caller is an admin
  // First, get the user ID from the authenticated request.
  const { userId } = getAuth(req);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized: No user ID in request" }), { status: 401 });
  }

  // Fetch the user's details from Clerk to check their role from public_metadata.
  try {
    const clerkUserResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    });

    if (!clerkUserResponse.ok) {
      console.error("Failed to fetch admin user data from Clerk.");
      return new Response(JSON.stringify({ error: "Error fetching user from Clerk" }), { status: 500 });
    }

    const clerkUser = await clerkUserResponse.json();
    const adminRole = clerkUser.public_metadata?.role;

    // If the user's role is not 'admin', deny the request.
    if (adminRole !== 'admin') {
      console.warn(`Unauthorized attempt to create user by userId: ${userId}`);
      return new Response(JSON.stringify({ error: "Unauthorized: User is not an admin" }), { status: 403 }); // 403 Forbidden is more appropriate
    }

  } catch (error) {
    console.error("Error verifying admin status:", error);
    return new Response(JSON.stringify({ error: "Internal server error during admin verification" }), { status: 500 });
  }

  // Parse the request body to get the new user's details.
  const body = await req.json();
  const { firstName, lastName, email, role, password } = body;

  // 2) Create user in Clerk via REST API
  let createdClerkUser;
  try {
    // Make a POST request to the Clerk API to create a new user.
    const clerkResp = await fetch("https://api.clerk.com/v1/users", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_address: [email],
        password: password,
        first_name: firstName,
        last_name: lastName,
        public_metadata: { role }, // Store the user's role in Clerk's public metadata.
      }),
    });

    if (!clerkResp.ok) {
      // If the Clerk API returns an error, log it and return a 500 response.
      const errorBody = await clerkResp.json().catch(() => clerkResp.text());
      console.error('Clerk API error response:', JSON.stringify(errorBody, null, 2));
      return new Response(JSON.stringify({ error: "Clerk user creation failed", details: errorBody }), { status: 500 });
    }

    createdClerkUser = await clerkResp.json();
    console.log('Successfully created user in Clerk:', JSON.stringify(createdClerkUser, null, 2));

  } catch (error) {
    console.error("Error during Clerk user creation request:", error);
    return new Response(JSON.stringify({ error: "Internal server error while creating user in Clerk" }), { status: 500 });
  }

  // 3) Extract the Clerk User ID from the response.
  const clerkUserId = createdClerkUser?.id;

  if (!clerkUserId) {
    console.error('Could not find user ID in Clerk API response.');
    return new Response(JSON.stringify({ error: "Clerk user created, but no ID was returned from API." }), { status: 500 });
  }

  // 4) Insert the new user into the Postgres database
  try {
    // First, get the role ID from the roles table
    const roleObject = await prisma.role.findUnique({
      where: { role_name: role },
    });

    if (!roleObject) {
      return new Response(JSON.stringify({ error: `Invalid role: ${role}` }), { status: 400 });
    }

    // Now that the user is created in Clerk, create a corresponding record in the local database.
    const created = await prisma.user.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        email,
        role_id: roleObject.id,
        clerk_user_id: clerkUserId,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'User Created',
        user_id: created.id,
        details: `User ${created.first_name} ${created.last_name} (${created.email}) was created with the role of ${roleObject.role_name}`,
      },
    });
    console.log('Successfully inserted user into database:', created);
    return new Response(JSON.stringify({ ok: true, user: created }), { status: 200 });
  } catch (e) {
    console.error('Database insertion failed after successful Clerk user creation. Rolling back...');
    console.error('Error details:', e);

    // CRITICAL: If the database insert fails, delete the orphaned user from Clerk to prevent data inconsistencies.
    // This is a rollback mechanism.
    await fetch(`https://api.clerk.com/v1/users/${clerkUserId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    });
    console.log(`Orphaned user ${clerkUserId} successfully deleted from Clerk.`);

    return new Response(JSON.stringify({ error: "Database insertion failed", details: e.message }), { status: 500 });
  }
}
