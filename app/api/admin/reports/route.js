import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/convex-server.js";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

/**
 * @file This API route handles fetching reports from Convex.
 * It is intended for admin use to retrieve and display generated reports.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await getConvexClient();
    const reports = await client.query(api.reports.list, {});
    
    return NextResponse.json(reports || []);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ message: 'Error fetching reports', reports: [] }, { status: 500 });
  }
}
