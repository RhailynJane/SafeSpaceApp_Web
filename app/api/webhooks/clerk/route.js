import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

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
      // Find the user in your database
      const userInDb = await prisma.user.findUnique({
        where: { clerk_user_id: id },
        include: { role: true },
      });

      let roleName = userInDb?.role?.role_name || 'support_worker'; // Default role

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

        // Trigger a session refresh for the user
        // This is a placeholder. Clerk's API for directly triggering a session refresh
        // is not directly exposed via a simple PATCH on the user object.
        // A common pattern is to update the user's metadata and then rely on
        // Clerk's session token refresh mechanism, or to explicitly sign out/in
        // the user if immediate refresh is critical (less user-friendly).
        // For now, updating public_metadata should eventually propagate.
        // If immediate propagation is needed, consider a client-side redirect
        // to a /syncing page that forces a re-authentication or token refresh.
        console.log(`Clerk user ${id} public_metadata updated with role: ${roleName}`);
      } else {
        console.warn(`User ${id} not found in local database after Clerk event ${eventType}. Skipping role sync.`);
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