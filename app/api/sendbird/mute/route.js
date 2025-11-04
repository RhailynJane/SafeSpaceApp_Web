import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { channelUrl, userId } = await request.json();

    if (!channelUrl || !userId) {
      return NextResponse.json({ error: "Missing channelUrl or userId" }, { status: 400 });
    }

    const endpoint = `https://api-${process.env.SENDBIRD_APP_ID}.sendbird.com/v3/group_channels/${channelUrl.trim()}/mute`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Api-Token": process.env.SENDBIRD_API_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId.trim() }),
    });

    if (!res.ok) {
      const error = await res.json();
      console.error("Sendbird mute API error:", error);
      return NextResponse.json({ error }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in mute API:", err);
    return NextResponse.json({ error: "Failed to mute channel" }, { status: 500 });
  }
}
