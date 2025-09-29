import { auth } from "@clerk/nextjs/server";
import pool from "@/lib/db";

export async function PATCH(req, { params }) {
  try {
    const { userId } = auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const { id } = params;
    const { status } = await req.json();

    // Allowed statuses for Team Leader
    if (!['accepted', 'declined', 'needs_info'].includes(status)) {
      return new Response("Invalid status", { status: 400 });
    }

    // Make sure this referral belongs to the team leader
    const leader = await pool.query(
      "SELECT id FROM users WHERE clerk_user_id = $1",
      [userId]
    );

    await pool.query(
      "UPDATE referrals SET status = $1 WHERE id = $2 AND assigned_to = $3",
      [status, id, leader.rows[0].id]
    );

    return new Response(JSON.stringify({ success: true, status }), { status: 200 });
  } catch (err) {
    console.error("Error updating referral:", err);
    return new Response("Server error", { status: 500 });
  }
}
