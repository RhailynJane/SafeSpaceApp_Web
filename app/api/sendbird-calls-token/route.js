import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const SENDBIRD_APP_ID = process.env.NEXT_PUBLIC_SENDBIRD_APP_ID;
    const SENDBIRD_API_TOKEN = process.env.SENDBIRD_API_TOKEN;

    if (!SENDBIRD_APP_ID || !SENDBIRD_API_TOKEN) {
      console.error("Sendbird environment variables not set.");
      return NextResponse.json(
        { error: "Server configuration error: Sendbird APP_ID or API_TOKEN missing" },
        { status: 500 }
      );
    }

    const sendbirdApiUrl = `https://api-${SENDBIRD_APP_ID}.sendbird.com/v3`;

    // First, ensure the user exists in Sendbird
    const userCheckResponse = await fetch(`${sendbirdApiUrl}/users/${userId}`,
      {
        method: "GET",
        headers: {
          "Api-Token": SENDBIRD_API_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );

    if (userCheckResponse.status === 404) {
      // User does not exist, create them
      const userCreateResponse = await fetch(`${sendbirdApiUrl}/users`,
        {
          method: "POST",
          headers: {
            "Api-Token": SENDBIRD_API_TOKEN,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            nickname: userId, // Or fetch from Clerk user data
            profile_url: "", // Optional
          }),
        }
      );

      if (!userCreateResponse.ok) {
        const errorData = await userCreateResponse.json();
        console.error("Sendbird user creation error:", userCreateResponse.status, errorData);
        return NextResponse.json(
          { error: "Failed to create Sendbird user" },
          { status: 500 }
        );
      }
    } else if (!userCheckResponse.ok) {
      const errorData = await userCheckResponse.json();
      console.error("Sendbird user check error:", userCheckResponse.status, errorData);
      return NextResponse.json(
        { error: "Failed to check Sendbird user existence" },
        { status: 500 }
      );
    }

    // Now fetch the access token
    const tokenResponse = await fetch(`${sendbirdApiUrl}/users/${userId}/access_token`,
      {
        method: "GET",
        headers: {
          "Api-Token": SENDBIRD_API_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Sendbird access token fetch error:", tokenResponse.status, errorData);
      return NextResponse.json(
        { error: "Failed to retrieve Sendbird access token" },
        { status: 500 }
      );
    }

    const data = await tokenResponse.json();
    const accessToken = data.token;

    return NextResponse.json({ accessToken });
  } catch (error) {
    console.error("Error in Sendbird access token API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}