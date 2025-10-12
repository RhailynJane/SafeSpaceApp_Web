// app/api/webhooks/clerk/route.ts
import { NextResponse } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { prisma } from "@/lib/prisma";

/**
 * Verified webhook endpoint for Clerk.
 * - Expects Clerk's Svix-signed webhook headers.
 * - Subscribes to user.created, user.updated, user.deleted events.
 *
 * Add CLERK_WEBHOOK_SECRET to your .env.local (value shown when creating webhook in Clerk).
 */

export async function POST(req) {
  const signingSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!signingSecret) {
    console.error("CLERK_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  // verifyWebhook will validate signature and parse JSON body safely
  let evt;
  try {
    evt = await verifyWebhook(req, { signingSecret });
  } catch (err) {
    console.error("Failed to verify Clerk webhook:", err);
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  try {
    const eventType = evt.type; // e.g. "user.created", "user.updated", "user.deleted"
    const data = evt.data;

    if (eventType === "user.created" || eventType === "user.updated") {
      const clerkId = data.id;
      // Determine a robust email - Clerk payload can vary; check common fields
      const email = data.primary_email_address?.email || data.email_addresses?.[0]?.email || data.email || null;
      const firstName = data.first_name || data.firstName || null;
      const lastName = data.last_name || data.lastName || null;

      // Find the default role (e.g., 'support_worker')
      const defaultRole = await prisma.role.findUnique({
        where: { role_name: "support_worker" },
      });

      if (!defaultRole) {
        console.error("Default role 'support_worker' not found.");
        return NextResponse.json({ error: "Default role not configured" }, { status: 500 });
      }

      await prisma.user.upsert({
        where: { clerk_user_id: clerkId },
        update: {
          email: email ?? undefined,
          first_name: firstName ?? undefined,
          last_name: lastName ?? undefined,
        },
        create: {
          clerk_user_id: clerkId,
          email: email ?? "",
          first_name: firstName ?? "",
          last_name: lastName ?? "",
          role_id: defaultRole.id,
        },
      });
    } else if (eventType === "user.deleted") {
      const clerkId = data.id;
      // You may prefer soft-delete; currently doing hard delete
      await prisma.user.deleteMany({ where: { clerk_user_id: clerkId } });
    } else {
      // ignore other events or implement handling if needed
      console.log("Ignored Clerk event:", eventType);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error processing Clerk webhook:", err);
    // Return 500 so Clerk will retry (helpful if DB temporarily down)
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
