import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { userId, targetId } = await request.json();

    if (!userId || !targetId) {
      return NextResponse.json(
        { error: "Missing userId or targetId" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `https://api-${process.env.SENDBIRD_APP_ID}.sendbird.com/v3/users/${encodeURIComponent(
        userId
      )}/block`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Api-Token": process.env.SENDBIRD_API_TOKEN,
        },
        body: JSON.stringify({ target_id: targetId }),
      }
    );

    if (!res.ok) {
      const error = await res.json();
      console.error("Sendbird block API error:", error);
      return NextResponse.json({ error }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error blocking user:", err);
    return NextResponse.json({ error: "Failed to block user" }, { status: 500 });
  }
}
