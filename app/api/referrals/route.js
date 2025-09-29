import { auth } from "@clerk/nextjs/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const { rows } = await pool.query(
      "SELECT * FROM referrals WHERE assigned_to = (SELECT id FROM users WHERE clerk_user_id = $1)",
      [userId]
    );

    return new Response(JSON.stringify(rows), { status: 200 });
  } catch (err) {
    console.error("Error fetching referrals:", err);
    return new Response("Server error", { status: 500 });
  }
}
