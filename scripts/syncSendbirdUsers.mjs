import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Sendbird user synchronization...');

  try {
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users to sync.`);

    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      if (!user.clerk_user_id) {
        console.warn(`- User with DB id ${user.id} has no clerk_user_id, skipping.`);
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
        console.log(`- Successfully synced user ${user.clerk_user_id}`);
        successCount++;
      } else {
        const errorData = await sendbirdResponse.json();
        if (errorData.code === 400201) { // User already exists
          console.log(`- User ${user.clerk_user_id} already exists in Sendbird, skipping.`);
          successCount++;
        } else {
          console.error(`- Failed to create Sendbird user for ${user.clerk_user_id}:`, errorData.message);
          errorCount++;
        }
      }
    }

    console.log('\n--- Sync Complete ---');
    console.log(`Total users processed: ${users.length}`);
    console.log(`Successfully synced: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('--------------------');

  } catch (err) {
    console.error('\nAn unexpected error occurred:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
