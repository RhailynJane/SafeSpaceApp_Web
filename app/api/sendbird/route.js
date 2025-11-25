import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { userIds, name, channel_url } = await request.json();
    console.log('Sendbird API request:', { userIds, name, channel_url });
    console.log('SENDBIRD_APP_ID:', process.env.SENDBIRD_APP_ID);
    console.log('SENDBIRD_API_TOKEN:', process.env.SENDBIRD_API_TOKEN ? 'Loaded' : 'Not Loaded');
    
    if (!process.env.SENDBIRD_APP_ID || !process.env.SENDBIRD_API_TOKEN) {
      return NextResponse.json({ error: 'Sendbird credentials not configured' }, { status: 500 });
    }
    
    const sendbirdApiUrl = `https://api-${process.env.SENDBIRD_APP_ID}.sendbird.com/v3`;
    const apiToken = process.env.SENDBIRD_API_TOKEN;

    // Helper function to create or update a Sendbird user
    const ensureUserExists = async (userId, nickname) => {
      try {
        // Try to create the user (will fail if exists, but that's okay)
        const createUserResponse = await fetch(
          `${sendbirdApiUrl}/users`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Api-Token': apiToken,
            },
            body: JSON.stringify({
              user_id: userId,
              nickname: nickname || userId,
              profile_url: '',
            }),
          }
        );

        const userData = await createUserResponse.json();
        
        if (createUserResponse.ok) {
          console.log(`Created Sendbird user: ${userId}`);
          return true;
        } else if (userData.code === 400202) {
          // User already exists, that's fine
          console.log(`Sendbird user already exists: ${userId}`);
          return true;
        } else {
          console.error(`Failed to create Sendbird user ${userId}:`, userData);
          return false;
        }
      } catch (error) {
        console.error(`Error ensuring Sendbird user exists (${userId}):`, error);
        return false;
      }
    };

    // Ensure both users exist in Sendbird
    console.log('Ensuring users exist in Sendbird...');
    const userCreationResults = await Promise.all(
      userIds.map((userId, index) => ensureUserExists(userId, index === 0 ? 'User' : name))
    );

    if (!userCreationResults.every(result => result)) {
      return NextResponse.json({ 
        error: 'Failed to create one or more users in Sendbird' 
      }, { status: 500 });
    }

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
      console.log('Existing channel found:', existingChannel.channel_url);
      return NextResponse.json({ channelUrl: existingChannel.channel_url });
    }

    // 2. If channel not found (404), create it
    if (getChannelResponse.status === 404 || getChannelResponse.status === 400) {
      console.log('Channel not found, creating new channel...');
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
        return NextResponse.json({ error: 'Failed to create channel', details: newChannelData }, { status: 500 });
      }

      console.log('New channel created:', newChannelData.channel_url);
      return NextResponse.json({ channelUrl: newChannelData.channel_url });
    }

    // 3. Handle other errors from getChannel
    const errorData = await getChannelResponse.json();
    console.error('Sendbird API error (get):', errorData);
    return NextResponse.json({ error: 'Failed to get or create channel', details: errorData }, { status: getChannelResponse.status });

  } catch (error) {
    console.error('Error in get-or-create Sendbird channel:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
