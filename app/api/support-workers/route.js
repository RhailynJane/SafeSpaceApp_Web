// app/api/support-workers/route.js
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get users with support_worker role from Convex
    const users = await convex.query(api.users.list, {
      clerkId: userId,
      roleId: 'support_worker',
    });

    // Transform to match expected format
    const supportWorkers = users.map(user => ({
      id: user._id,
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
    }));

    return NextResponse.json(supportWorkers);
  } catch (error) {
    console.error('Error fetching support workers:', error);
    return NextResponse.json({ message: 'Error fetching support workers' }, { status: 500 });
  }
}
