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
    
    // Get security-related audit logs (last 500 entries to ensure we get enough data)
    const logs = await client.query(api.auditLogs.list, {
      limit: 500,
    });
    
    // Filter for CMHA organization security events in the last 24 hours
    const recentSecurityEvents = logs.filter(log => {
      const isRecent = log.timestamp > Date.now() - 24 * 60 * 60 * 1000;
      const isCMHA = log.orgName?.toLowerCase() === 'cmha' || log.orgName?.toLowerCase().includes('canadian mental health');
      const isSecurityRelated = 
        log.action?.toLowerCase().includes('login_failed') ||
        log.action?.toLowerCase().includes('access_denied') ||
        log.action?.toLowerCase().includes('unauthorized_access') ||
        log.action?.toLowerCase().includes('permission_denied') ||
        log.action?.toLowerCase().includes('blocked') ||
        log.action?.toLowerCase().includes('security_breach') ||
        log.action?.toLowerCase().includes('failed_authentication');
      
      return isRecent && isCMHA && isSecurityRelated;
    });
    
    return NextResponse.json({ 
      unreadAlerts: recentSecurityEvents.length,
      logs: recentSecurityEvents
    });
  } catch (error) {
    console.error('Error fetching security alerts:', error);
    return NextResponse.json({ 
      message: 'Error fetching security alerts', 
      unreadAlerts: 0,
      logs: [] 
    }, { status: 200 });
  }
}

