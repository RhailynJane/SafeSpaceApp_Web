/**
 * API Route: Create Sendbird Chat Channel
 * 
 *  * // AI-generated documentation (Claude)
 * Prompt: Add proper comments and explanations
 * 
 * Purpose:
 * This API endpoint creates a private chat channel between two users using Sendbird's
 * messaging service. It ensures only authenticated users can create channels and 
 * sets up a direct conversation between the current user and a client.
 * 
 * HTTP Method: POST
 * Endpoint: /api/messages/create-channel 
 * 
 * Request Body:
 * {
 *   userId: string  // The ID of the client/user to chat with
 * }
 * 
 * Returns:
 * - Success: JSON object with the channel URL { channelUrl: string }
 * - Unauthorized: 401 status if user is not logged in
 * - Error: JSON object with error message and 500 status code
 * 
 * Use Case:
 * When a support worker or team leader wants to start a chat with a client,
 * this endpoint creates a unique chat channel between them using Sendbird's
 * real-time messaging platform.
 * 
 * Security:
 * - Uses Clerk authentication to verify the user is logged in
 * - Uses Sendbird's master API token for server-to-server communication
 * - Creates distinct channels (prevents duplicate channels between same users)
 */

// Import NextResponse - Next.js helper for creating API responses
import { NextResponse } from 'next/server';

// Import getAuth - Clerk authentication helper to identify the logged-in user
import { getAuth } from '@clerk/nextjs/server';

/**
 * POST Handler Function
 * 
 * This function runs when someone makes a POST request to this endpoint.
 * It takes the request object which contains information about who is making
 * the request and what data they're sending.
 * 
 * @param {Request} request - The incoming HTTP request object
 * @returns {Promise<NextResponse>} JSON response with channel URL or error
 */
export async function POST(request) {
  // Extract the client's user ID from the request body
  // This is the person the current user wants to chat with
  const { userId: clientUserId } = await request.json();
  
  // Get the ID of the currently logged-in user from Clerk authentication
  // This is the person making the request
  const { userId: currentUserId } = getAuth(request);

  // Security check: ensure the user is authenticated (logged in)
  if (!currentUserId) {
    // Return 401 Unauthorized if no user is logged in
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Make a request to Sendbird's REST API to create a group channel
    // Sendbird is a third-party messaging service that handles real-time chat
    const response = await fetch(
      // Construct the Sendbird API URL using the app ID from environment variables
      `https://api-${process.env.SENDBIRD_APP_ID}.sendbird.com/v3/group_channels`,
      {
        // HTTP method for creating a new resource
        method: 'POST',
        
        // Set request headers
        headers: {
          // Tell Sendbird we're sending JSON data
          'Content-Type': 'application/json',
          
          // Authenticate with Sendbird using the master API token
          // This token is stored securely in environment variables
          'Api-Token': process.env.SENDBIRD_API_TOKEN,
        },
        
        // The data we're sending to Sendbird to create the channel
        body: JSON.stringify({
          // Array of user IDs who will be in this chat channel
          user_ids: [clientUserId, currentUserId],
          
          // is_distinct: true means if a channel already exists between these
          // two users, return that channel instead of creating a duplicate
          is_distinct: true,
          
          // Human-readable name for the channel
          name: `Chat with ${clientUserId}`,
        }),
      }
    );

    // Parse the JSON response from Sendbird
    const data = await response.json();

    // Check if Sendbird returned an error
    if (!response.ok) {
      // Log the error details to the server console for debugging
      console.error('Sendbird API error:', data);
      
      // Return a 500 error to the client
      return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 });
    }

    // Success! Return the channel URL to the client
    // The client can use this URL to open and display the chat
    return NextResponse.json({ channelUrl: data.channel_url });
    
  } catch (error) {
    // Catch any unexpected errors (network issues, JSON parsing errors, etc.)
    console.error('Server error creating Sendbird channel:', error);
    
    // Return a generic error response to the client
    return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 });
  }
}