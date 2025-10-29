import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { userIds, name } = await request.json();

    // ✅ Validate input
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'userIds must be a non-empty array.' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api-${process.env.SENDBIRD_APP_ID}.sendbird.com/v3/group_channels`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Token': process.env.SENDBIRD_API_TOKEN,
        },
        body: JSON.stringify({
          user_ids: userIds,
          is_distinct: true,
          name: name || `Chat between ${userIds.join(', ')}`,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Sendbird API error:', data);
      return NextResponse.json(
        { error: data.message || 'Failed to create channel' },
        { status: response.status }
      );
    }

    return NextResponse.json({ channelUrl: data.channel_url });
  } catch (error) {
    console.error('Error creating Sendbird channel:', error);
    return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 });
  }
}
