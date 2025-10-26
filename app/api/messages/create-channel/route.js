import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function POST(request) {
  const { userId: clientUserId } = await request.json();
  const { userId: currentUserId } = getAuth(request);

  if (!currentUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Call Sendbird REST API directly
    const response = await fetch(
      `https://api-${process.env.SENDBIRD_APP_ID}.sendbird.com/v3/group_channels`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Token': process.env.SENDBIRD_API_TOKEN, // must be your master API token
        },
        body: JSON.stringify({
          user_ids: [clientUserId, currentUserId],
          is_distinct: true,
          name: `Chat with ${clientUserId}`,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Sendbird API error:', data);
      return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 });
    }

    return NextResponse.json({ channelUrl: data.channel_url });
  } catch (error) {
    console.error('Server error creating Sendbird channel:', error);
    return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 });
  }
}
