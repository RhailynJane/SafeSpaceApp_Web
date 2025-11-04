import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma.js";
import { NextResponse } from "next/server";

export async function GET(request) {

  try {

    const { userId } = await auth();

    

    if (!userId) {

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    }



    let user = await prisma.user.findUnique({

      where: { clerk_user_id: userId },

      include: { role: true },

    });



    if (!user) {

      const clerkUser = await currentUser();

      if (!clerkUser) {

        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      }



      const emailAddress = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId);

      if (!emailAddress) {

        return NextResponse.json({ error: "Primary email address not found for Clerk user." }, { status: 500 });

      }

      const email = emailAddress.emailAddress;



      const rawRole = clerkUser.publicMetadata.role || "support_worker";

      const roleName = rawRole ? rawRole.replace(/-/g, "_") : "support_worker";



      const role = await prisma.role.findUnique({

        where: { role_name: roleName },

      });



      if (!role) {

        return NextResponse.json({ error: `Role '${roleName}' not found` }, { status: 500 });

      }



      user = await prisma.user.upsert({

        where: { email: email },

        update: { clerk_user_id: clerkUser.id },

        create: {

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

    }



    if (!user.role) {

      return NextResponse.json({ error: `User with clerk_user_id ${userId} has an invalid role_id.` }, { status: 500 });

    }



    const userRole = user.role.role_name.replace(/_/g, "-");



    let clients;

    if (userRole === "support-worker") {

      clients = await prisma.client.findMany({
        select: {
          id: true,
          client_first_name: true,
          client_last_name: true,
          last_session_date: true,
          risk_level: true,
          status: true,
          email: true,
          user: {
            select: {
              clerk_user_id: true,
            },
          },
        },
      });

    } else {

      clients = await prisma.client.findMany({

        orderBy: { created_at: "desc" },
        select: {
          id: true,
          client_first_name: true,
          client_last_name: true,
          last_session_date: true,
          risk_level: true,
          status: true,
          email: true,
          user: {
            select: {
              clerk_user_id: true,
            },
          },
        },
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
