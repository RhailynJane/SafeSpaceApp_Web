import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Find the user in your Prisma-managed users table
    const user = await prisma.user.findUnique({
      where: { clerk_user_id: userId },
      include: { role: true }, // make sure your user model has relation "role"
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    // Safely handle user without a role
    const roleName = user.role?.role_name || "unknown";

    // Always return valid JSON
    return new Response(
      JSON.stringify({ user: { id: user.id, role: roleName } }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error in /api/getRole:", err);
    return new Response(
      JSON.stringify({ error: "Server error", details: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
