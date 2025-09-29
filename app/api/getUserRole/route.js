import pool from "@/lib/db";

export async function POST(req) {
  const { email } = await req.json();

  const res = await pool.query("SELECT role FROM users WHERE email=$1", [email]);
  if (res.rows.length === 0) {
    return new Response(JSON.stringify({ role: null }), { status: 404 });
  }

  return new Response(JSON.stringify({ role: res.rows[0].role }), { status: 200 });
}
