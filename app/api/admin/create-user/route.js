// app/api/admin/create-user/route.js
import { getAuth } from "@clerk/nextjs/server";
import pool from "@/lib/db";

export async function POST(req) {
  console.log('Create-user endpoint called');

  // 1) Verify the caller is an admin
  const { userId } = getAuth(req);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized: No user ID in request" }), { status: 401 });
  }

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

    if (adminRole !== 'admin') {
      console.warn(`Unauthorized attempt to create user by userId: ${userId}`);
      return new Response(JSON.stringify({ error: "Unauthorized: User is not an admin" }), { status: 403 }); // 403 Forbidden is more appropriate
    }

  } catch (error) {
    console.error("Error verifying admin status:", error);
    return new Response(JSON.stringify({ error: "Internal server error during admin verification" }), { status: 500 });
  }
  
  const body = await req.json();
  const { firstName, lastName, email, role, password } = body;

  // 2) Create user in Clerk via REST API
  let createdClerkUser;
  try {
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
        public_metadata: { role },
      }),
    });

    if (!clerkResp.ok) {
      // Log the detailed error from Clerk for debugging
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

  // 3) Extract the Clerk User ID
  const clerkUserId = createdClerkUser?.id;

  if (!clerkUserId) {
    console.error('Could not find user ID in Clerk API response.');
    return new Response(JSON.stringify({ error: "Clerk user created, but no ID was returned from API." }), { status: 500 });
  }

  // 4) Insert the new user into the Postgres database
  try {
    const insertRes = await pool.query(
      `INSERT INTO users (first_name, last_name, email, role, clerk_user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [firstName, lastName, email, role, clerkUserId]
    );
    console.log('Successfully inserted user into database:', insertRes.rows[0]);
    return new Response(JSON.stringify({ ok: true, user: insertRes.rows[0] }), { status: 200 });
  } catch (e) {
    console.error('Database insertion failed after successful Clerk user creation. Rolling back...');
    console.error('Error details:', e);

    // CRITICAL: If DB insert fails, delete the orphaned user from Clerk to prevent inconsistencies.
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
