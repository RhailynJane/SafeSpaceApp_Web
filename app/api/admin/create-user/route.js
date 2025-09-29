// app/api/admin/create-user/route.js
import { auth } from "@clerk/nextjs/server"; // server helper
import pool from "@/lib/db";

export async function POST(req) {
  // 1) verify caller is admin
  const { userId, sessionId, isSignedIn, sessionClaims } = await auth();
  if (!isSignedIn || sessionClaims?.metadata?.role !== "admin") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const body = await req.json();
  const { firstName, lastName, email, role, password } = body;

  // 2) Create user in Clerk via REST (simple, stable)
  const clerkResp = await fetch("https://api.clerk.com/v1/users", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email_address: [email],
      password: password, // admin gives initial password
      first_name: firstName,
      last_name: lastName,
      public_metadata: { role }, // set role in Clerk public metadata
    }),
  });

  if (!clerkResp.ok) {
    const err = await clerkResp.text();
    return new Response(JSON.stringify({ error: "Clerk create failed", err }), { status: 500 });
  }

  const clerkUser = await clerkResp.json();
  const clerkUserId = clerkUser.id || clerkUser.user_id || clerkUser.data?.id;

  // 3) Insert into Postgres
  try {
    const insertRes = await pool.query(
      `INSERT INTO users (first_name, last_name, email, role, clerk_user_id) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [firstName, lastName, email, role, clerkUserId]
    );
    return new Response(JSON.stringify({ ok: true, user: insertRes.rows[0] }), { status: 200 });
  } catch (e) {
    console.error(e);
    // You may want to roll back the user in Clerk in case of DB error (delete by clerk ID).
    return new Response(JSON.stringify({ error: "DB insert failed" }), { status: 500 });
  }
}
