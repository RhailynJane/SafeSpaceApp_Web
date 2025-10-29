import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { channelUrl, userId } = await request.json();

    if (!channelUrl || !userId) {
      return NextResponse.json({ error: "Missing channelUrl or userId" }, { status: 400 });
    }

    // Hide the channel for this user (clears history)
    const endpoint = `https://api-${process.env.SENDBIRD_APP_ID}.sendbird.com/v3/users/${encodeURIComponent(
      userId
    )}/my_group_channels/${encodeURIComponent(channelUrl)}/hide`;

    const res = await fetch(endpoint, {
      method: "PUT",
      headers: {
        "Api-Token": process.env.SENDBIRD_API_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        hide_previous_messages: true,
        allow_auto_unhide: true,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      console.error("Sendbird hide API error:", error);
      return NextResponse.json({ error }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error clearing chat:", err);
    return NextResponse.json({ error: "Failed to clear chat" }, { status: 500 });
  }
}
