import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { channelUrl } = await request.json();
    if (!channelUrl) {
      return NextResponse.json({ error: "Missing channelUrl" }, { status: 400 });
    }

    const endpoint = `https://api-${process.env.SENDBIRD_APP_ID}.sendbird.com/v3/group_channels/${encodeURIComponent(channelUrl)}?show_member=true`;

    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Api-Token": process.env.SENDBIRD_API_TOKEN,
      },
    });

    if (!res.ok) {
      const error = await res.json();
      console.error("Sendbird members API error:", error);
      return NextResponse.json({ error }, { status: res.status });
    }

    const data = await res.json();
    // The members may be in data.members or data['members'] depending on API, return them consistently
    const members = data.members || data['members'] || [];
    return NextResponse.json({ members });
  } catch (err) {
    console.error("Error fetching channel members:", err);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}
