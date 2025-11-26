import { NextResponse } from 'next/server';

/**
 * POST /api/daily/create-room
 * 
 * Creates a Daily.co room for video calls
 * Returns the room URL for participants to join
 * 
 * Daily.co features:
 * - HIPAA compliant (perfect for therapy/healthcare)
 * - 10,000 free minutes per month
 * - Automatic expiration after session ends
 * - No account required for participants
 */
export async function POST(request) {
  try {
    const { appointmentId, participants } = await request.json();

    // Validate request
    if (!appointmentId || !participants || participants.length < 2) {
      return NextResponse.json(
        { error: 'Invalid request. appointmentId and participants required.' },
        { status: 400 }
      );
    }

    // Get Daily.co API key from environment
    const apiKey = process.env.DAILY_API_KEY;
    if (!apiKey) {
      console.error('DAILY_API_KEY not configured');
      return NextResponse.json(
        { error: 'Video calling not configured. Contact administrator.' },
        { status: 500 }
      );
    }

    // Create a room with Daily.co API
    // Rooms automatically expire after last participant leaves (with 5 minute grace period)
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        name: `appointment-${appointmentId}-${Date.now()}`, // Unique room name
        privacy: 'private', // Requires URL to join (more secure)
        properties: {
          enable_screenshare: true,
          enable_chat: true,
          enable_knocking: false, // Auto-join without waiting
          enable_prejoin_ui: false, // Skip pre-join UI for seamless experience
          start_video_off: false,
          start_audio_off: false,
          // Automatically expire after 24 hours for security
          exp: Math.floor(Date.now() / 1000) + 86400,
          // Enable recording if needed (requires Daily.co plan)
          // enable_recording: 'cloud',
          max_participants: participants.length, // Limit to appointment participants
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Daily.co API error:', errorData);
      throw new Error(errorData.error || 'Failed to create room');
    }

    const roomData = await response.json();

    return NextResponse.json({
      roomUrl: roomData.url,
      roomName: roomData.name,
      expiresAt: new Date(roomData.config.exp * 1000).toISOString(),
    });

  } catch (error) {
    console.error('Error creating Daily.co room:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create video room' },
      { status: 500 }
    );
  }
}
