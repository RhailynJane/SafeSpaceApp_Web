
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

    // Get team leaders from Convex
    const teamLeaders = await convex.query(api.users.getTeamLeaders, {
      clerkId: userId,
    });

    if (!teamLeaders || teamLeaders.length === 0) {
      return NextResponse.json({ error: 'Supervisor not found' }, { status: 404 });
    }

    // Return the first team leader (for backwards compatibility)
    const supervisor = teamLeaders[0];
    return NextResponse.json({
      id: supervisor._id,
      first_name: supervisor.firstName,
      last_name: supervisor.lastName,
      email: supervisor.email,
    });
  } catch (error) {
    console.error('Error fetching supervisor:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
