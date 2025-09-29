import { auth } from "@clerk/nextjs/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const result = await pool.query(
      `SELECT r.id, r.details, r.status, r.created_at, u.name AS created_by
       FROM referrals r
       JOIN users u ON r.created_by = u.id
       WHERE r.assigned_to = (SELECT id FROM users WHERE clerk_user_id = $1)`,
      [userId]
    );

    return new Response(JSON.stringify(result.rows), { status: 200 });

  } catch (err) {
    console.error("Error fetching referrals:", err);
    return new Response("Server error", { status: 500 });
  }
}
