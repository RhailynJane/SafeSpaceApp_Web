import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(req) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers',
      {
        status: 400
      });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Webhook instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt;
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured',
      {
        status: 400
      });
  }

  const eventType = evt.type;

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    const email = email_addresses[0]?.email_address;

    if (!email) {
      return new Response('Error: User email not found',
        {
          status: 400
        });
    }

    try {
      // Find the user in Convex database
      const userInDb = await convex.query(api.users.getByClerkId, {
        clerkId: id,
      });

      let roleName = userInDb?.roleId || 'support_worker'; // Default role

      if (userInDb) {
        // Update Clerk's public_metadata with the role from your database
        await fetch(`https://api.clerk.com/v1/users/${id}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              public_metadata: { role: roleName },
            }),
          });

        console.log(`Clerk user ${id} public_metadata updated with role: ${roleName}`);
      } else {
        console.warn(`User ${id} not found in Convex database after Clerk event ${eventType}. Skipping role sync.`);
      }

    } catch (error) {
      console.error(`Error processing Clerk webhook for user ${id}:`, error);
      return new Response('Error processing webhook',
        {
          status: 500
        });
    }
  }

  return new Response('Webhook received',
    {
      status: 200
    });
}