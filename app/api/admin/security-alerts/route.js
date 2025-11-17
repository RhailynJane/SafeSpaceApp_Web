// app/api/admin/security-alerts/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
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
 * @file This API route handles fetching security-related audit logs from Convex.
 * It is intended for admin use to monitor security events.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await getConvexClient();
    
    // Get security-related audit logs (last 100 entries)
    const logs = await client.query(api.auditLogs.list, {
      limit: 100,
      startDate: Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
    });
    
    // Count unread/recent security alerts
    const recentSecurityEvents = logs.filter(log => 
      log.action.includes('security') || 
      log.action.includes('login_failed') ||
      log.action.includes('unauthorized') ||
      log.timestamp > Date.now() - 24 * 60 * 60 * 1000 // Last 24 hours
    );
    
    return NextResponse.json({ 
      unreadAlerts: recentSecurityEvents.length,
      logs: logs || [] 
    });
  } catch (error) {
    console.error('Error fetching security alerts:', error);
    return NextResponse.json({ 
      message: 'Error fetching security alerts', 
      unreadAlerts: 0,
      logs: [] 
    }, { status: 500 });
  }
}

