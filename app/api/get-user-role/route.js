import pool from "@/lib/db";

export async function POST(req) {
  const { email, userId } = await req.json();

  if (!email) return new Response(JSON.stringify({ error: "email required" }), { status: 400 });

  const res = await pool.query("SELECT role FROM users WHERE email=$1", [email]);
  if (res.rows.length === 0) return new Response(JSON.stringify({ role: null }), { status: 404 });

  const role = res.rows[0].role;

  if (userId) {
    try {
      const response = await fetch(`https://api.clerk.com/v1/users/${userId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ public_metadata: { role } }),
        }
      );
      const data = await response.json();
    } catch (error) {
      console.error("Error updating user metadata:", error);
      // It's probably fine to continue even if this fails
    }
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  return new Response(JSON.stringify({ role }), { status: 200 });
}
