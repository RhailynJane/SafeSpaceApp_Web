// app/api/admin/metrics/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

async function getConvexClient() {
  const { getToken } = await auth();
  const token = await getToken({ template: "convex" });
  
  const client = new ConvexHttpClient(convexUrl);
  client.setAuth(token);
  
  return client;
}

/**
 * @file This API route handles fetching metrics from Convex.
 * It is intended for admin use to retrieve organization-scoped user statistics.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await getConvexClient();
    
    // Get the current user's organization
    const currentUser = await client.query(api.users.getByClerkId, { clerkId: userId });
    const orgId = currentUser?.orgId || null;

    if (!orgId) {
      // Return default values instead of error to prevent page crashes
      return NextResponse.json({ 
        totalUsers: 0, 
        byRole: {}, 
        active: 0, 
        inactive: 0, 
        suspended: 0 
      });
    }

    const stats = await client.query(api.users.getOrgUserStats, { clerkId: userId, orgId });
    return NextResponse.json({ 
      totalUsers: stats.total || 0, 
      byRole: stats.byRole || {}, 
      active: stats.active || 0, 
      inactive: stats.inactive || 0, 
      suspended: stats.suspended || 0 
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json({ 
      message: 'Error fetching metrics',
      totalUsers: 0, 
      byRole: {}, 
      active: 0, 
      inactive: 0, 
      suspended: 0 
    }, { status: 500 });
  }
}