import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = auth();
    const user = await currentUser();

    if (!user || user.publicMetadata.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }

    const referrals = await prisma.referral.findMany({
      orderBy: { created_at: "desc" },
    });

    return Response.json(referrals);
  } catch (error) {
    console.error("Error fetching referrals:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { userId } = auth();
    const user = await currentUser();

    if (!user || user.publicMetadata.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }

    const data = await req.json();

    const referral = await prisma.referral.create({
      data: {
        client_first_name: data.client_first_name,
        client_last_name: data.client_last_name,
        age: data.age ? parseInt(data.age) : null,
        phone: data.phone,
        address: data.address,
        email: data.email,
        emergency_first_name: data.emergency_first_name,
        emergency_last_name: data.emergency_last_name,
        emergency_phone: data.emergency_phone,
        referral_source: data.referral_source || "Unknown",
        reason_for_referral: data.reason_for_referral || "",
        additional_notes: data.additional_notes || "",
        submitted_date: new Date(),
        status: "Pending",
      },
    });

    return Response.json(referral, { status: 201 });
  } catch (error) {
    console.error("Error creating referral:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
