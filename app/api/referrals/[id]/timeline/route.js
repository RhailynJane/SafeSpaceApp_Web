import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

async function getConvexClient() {
  const { getToken } = await auth();
  const token = await getToken({ template: "convex" });
  
  const client = new ConvexHttpClient(convexUrl);
  client.setAuth(token);
  
  return client;
}

export async function GET(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: referralId } = await params;
    if (!referralId) {
      return NextResponse.json({ error: "Referral ID is required" }, { status: 400 });
    }

    const client = await getConvexClient();
    const timelineData = await client.query(api.referrals.getTimeline, { referralId });

    return NextResponse.json(timelineData);
  } catch (error) {
    console.error("Error fetching referral timeline:", error);
    return NextResponse.json(
      { error: "Failed to fetch timeline", details: error.message },
      { status: 500 }
    );
  }
}