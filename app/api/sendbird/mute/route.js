import { NextResponse } from "next/server";

export async function POST(request) {
  const { channelUrl } = await request.json();

  const res = await fetch(
    `https://api-${process.env.SENDBIRD_APP_ID}.sendbird.com/v3/group_channels/${channelUrl}/hide`,
    {
      method: "PUT",
      headers: {
        "Api-Token": process.env.SENDBIRD_API_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ hide_previous_messages: false }),
    }
  );

  if (!res.ok) {
    const error = await res.json();
    console.error("Mute failed:", error);
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
