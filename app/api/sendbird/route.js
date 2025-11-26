import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { userIds, name, channel_url } = await request.json();
    console.log('SENDBIRD_APP_ID:', process.env.SENDBIRD_APP_ID);
    console.log('SENDBIRD_API_TOKEN:', process.env.SENDBIRD_API_TOKEN ? 'Loaded' : 'Not Loaded');
    const sendbirdApiUrl = `https://api-${process.env.SENDBIRD_APP_ID}.sendbird.com/v3`;
    const apiToken = process.env.SENDBIRD_API_TOKEN;

    // 1. Try to get the channel by its URL
    const getChannelResponse = await fetch(
      `${sendbirdApiUrl}/group_channels/${channel_url}`,
      {
        method: 'GET',
        headers: {
          'Api-Token': apiToken,
        },
      }
    );

    if (getChannelResponse.ok) {
      // Channel already exists, return its URL
      const existingChannel = await getChannelResponse.json();
      return NextResponse.json({ channelUrl: existingChannel.channel_url });
    }

    // 2. If channel not found (404), create it
    if (getChannelResponse.status === 404) {
      const createChannelResponse = await fetch(
        `${sendbirdApiUrl}/group_channels`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Api-Token': apiToken,
          },
          body: JSON.stringify({
            user_ids: userIds,
            channel_url: channel_url,
            name: name || `Chat between ${userIds.join(', ')}`,
            is_distinct: false,
          }),
        }
      );

      const newChannelData = await createChannelResponse.json();

      if (!createChannelResponse.ok) {
        console.error('Sendbird API error (create):', newChannelData);
        return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 });
      }

      return NextResponse.json({ channelUrl: newChannelData.channel_url });
    }

    // 3. Handle other errors from getChannel
    const errorData = await getChannelResponse.json();
    console.error('Sendbird API error (get):', errorData);
    return NextResponse.json({ error: 'Failed to get or create channel' }, { status: getChannelResponse.status });

  } catch (error) {
    console.error('Error in get-or-create Sendbird channel:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
