import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { userId } = await auth();
    
    console.log("Fetching clients for userId:", userId);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let user = await prisma.user.findUnique({
      where: { clerk_user_id: userId },
      include: { role: true },
    });

    console.log("Found user:", user);

    if (!user) {
      console.log("User not found, creating a new user...");
      
      const clerkUser = await currentUser();
      if (!clerkUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const email = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId).emailAddress;

      const roleName = clerkUser.publicMetadata.role || "support_worker";
      const role = await prisma.role.findUnique({
        where: { role_name: roleName },
      });

      if (!role) {
        return NextResponse.json({ error: `Role '${roleName}' not found` }, { status: 500 });
      }

      user = await prisma.user.create({
        data: {
          clerk_user_id: clerkUser.id,
          email: email,
          first_name: clerkUser.firstName || "",
          last_name: clerkUser.lastName || "",
          role_id: role.id,
        },
        include: {
          role: true,
        },
      });
      console.log("Created user:", user);
    }

    const userRole = user.role.role_name.replace(/_/g, "-");

    let clients;
    if (userRole === "support-worker") {
      clients = await prisma.client.findMany({
        where: { user_id: user.id },
        orderBy: { created_at: "desc" },
      });
    } else {
      clients = await prisma.client.findMany({
        orderBy: { created_at: "desc" },
      });
    }

    return NextResponse.json(clients, { status: 200 });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { message: "Error fetching clients", error: error.message },
      { status: 500 }
    );
  }
}
