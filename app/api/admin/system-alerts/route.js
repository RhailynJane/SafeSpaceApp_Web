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

/**
 * @file This API route handles fetching system alerts from Convex.
 * It is intended for admin use to monitor system-wide notifications.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await getConvexClient();
    const alerts = await client.query(api.systemAlerts.list, {});
    
    return NextResponse.json({ alerts: alerts || [] });
  } catch (error) {
    console.error('Error fetching system alerts:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json({ 
      message: 'Error fetching system alerts', 
      error: error.message,
      alerts: [] 
    }, { status: 200 }); // Return 200 with empty alerts to prevent UI crashes
  }
}
