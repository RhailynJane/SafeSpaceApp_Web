// app/api/users/syncAllToSendbird/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    // 1. Authenticate and authorize the user
    const { sessionClaims } = auth();
    const role = sessionClaims?.metadata?.role;

    if (role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 2. Fetch all users from the local database
    const users = await prisma.user.findMany();

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // 3. Iterate and sync each user to Sendbird
    for (const user of users) {
      if (!user.clerk_user_id) {
        console.warn(`User with DB id ${user.id} has no clerk_user_id, skipping.`);
        continue;
      }

      const sendbirdResponse = await fetch(
        `https://api-${process.env.SENDBIRD_APP_ID}.sendbird.com/v3/users`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Api-Token': process.env.SENDBIRD_API_TOKEN,
          },
          body: JSON.stringify({
            user_id: user.clerk_user_id,
            nickname: `${user.first_name} ${user.last_name}`,
            profile_url: user.profile_image_url || '',
          }),
        }
      );

      if (sendbirdResponse.ok) {
        successCount++;
      } else {
        const errorData = await sendbirdResponse.json();
        // Check if the error is because the user already exists
        if (errorData.code === 400201) { // Sendbird's error code for "user already exists"
          successCount++; // If user already exists, we can consider it a success for our purpose
        } else {
          errorCount++;
          errors.push({ userId: user.clerk_user_id, error: errorData });
          console.error(`Failed to create Sendbird user for ${user.clerk_user_id}:`, errorData);
        }
      }
    }

    // 4. Return a summary
    return NextResponse.json({
      message: 'Sendbird user synchronization complete.',
      totalUsers: users.length,
      syncedSuccessfully: successCount,
      errors: errorCount,
      errorDetails: errors,
    });

  } catch (err) {
    console.error('Error in syncAllToSendbird API:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
