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

function parseDates(searchParams) {
  const start = searchParams.get('startDate');
  const end = searchParams.get('endDate');
  const now = Date.now();
  const preset = searchParams.get('range'); // 24hours|7days|30days|90days|all
  let startDate = start ? Number(start) : undefined;
  let endDate = end ? Number(end) : undefined;
  if (!startDate && !endDate && preset && preset !== 'all') {
    const ranges = {
      '24hours': now - 24 * 60 * 60 * 1000,
      '7days': now - 7 * 24 * 60 * 60 * 1000,
      '30days': now - 30 * 24 * 60 * 60 * 1000,
      '90days': now - 90 * 24 * 60 * 60 * 1000,
    };
    startDate = ranges[preset];
    endDate = now;
  }
  return { startDate, endDate };
}

function dailyBuckets(logs) {
  const byDay = new Map();
  for (const l of logs) {
    const d = new Date(l.timestamp);
    const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    byDay.set(key, (byDay.get(key) || 0) + 1);
  }
  return Array.from(byDay.entries())
    .sort((a,b)=>a[0]-b[0])
    .map(([ts,count])=>({ date: ts, count }));
}

export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'userManagement';
    const { startDate, endDate } = parseDates(url.searchParams);

    const client = await getConvexClient();

    // Determine org scope
    const currentUser = await client.query(api.users.getByClerkId, { clerkId: userId });
    const orgId = currentUser?.orgId || null;

    if (!orgId) {
      return NextResponse.json({ type, orgId: null, data: {}, generatedAt: Date.now() });
    }

    if (type === 'userManagement') {
      const stats = await client.query(api.users.getOrgUserStats, { clerkId: userId, orgId });
      // Optionally list users for table export
      let users = [];
      try {
        users = await client.query(api.users.list, { clerkId: userId, orgId });
      } catch {}
      return NextResponse.json({
        type,
        orgId,
        filters: { startDate, endDate },
        data: { stats, users },
        generatedAt: Date.now(),
      });
    }

    if (type === 'audits') {
      // Pull enriched logs then scope to org
      const logs = await client.query(api.auditLogs.list, {
        limit: 1000,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      const scoped = (logs || []).filter(l => {
        const orgName = (l.orgName || '').toLowerCase();
        const orgSlug = (l.orgSlug || '').toLowerCase();
        return (orgName.includes('cmha') || orgSlug.includes('cmha') || (currentUser?.orgId && l.orgId === currentUser.orgId));
      });

      const byAction = {};
      const byEntityType = {};
      for (const l of scoped) {
        byAction[l.action] = (byAction[l.action] || 0) + 1;
        if (l.entityType) byEntityType[l.entityType] = (byEntityType[l.entityType] || 0) + 1;
      }
      const series = dailyBuckets(scoped);
      return NextResponse.json({
        type,
        orgId,
        filters: { startDate, endDate },
        data: { total: scoped.length, byAction, byEntityType, series, logs: scoped },
        generatedAt: Date.now(),
      });
    }

    if (type === 'performance') {
      const logs = await client.query(api.auditLogs.list, {
        limit: 1000,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      const allowed = new Set(['team_leader','support_worker']);
      const scoped = (logs || []).filter(l => {
        const orgName = (l.orgName || '').toLowerCase();
        const orgSlug = (l.orgSlug || '').toLowerCase();
        const role = (l.userRole || '').toLowerCase();
        return (orgName.includes('cmha') || orgSlug.includes('cmha') || (currentUser?.orgId && l.orgId === currentUser.orgId))
          && allowed.has(role);
      });

      const byUser = {};
      for (const l of scoped) {
        const key = l.userId || l.userEmail || l.userName || 'unknown';
        if (!byUser[key]) {
          byUser[key] = {
            userId: l.userId || null,
            userName: l.userName || 'Unknown',
            userEmail: l.userEmail || null,
            userRole: l.userRole || null,
            totalActions: 0,
            byAction: {},
            byEntityType: {},
          };
        }
        byUser[key].totalActions += 1;
        byUser[key].byAction[l.action] = (byUser[key].byAction[l.action] || 0) + 1;
        if (l.entityType) byUser[key].byEntityType[l.entityType] = (byUser[key].byEntityType[l.entityType] || 0) + 1;
      }

      // Overall context like number of clients in org
      let clientCount = 0;
      try {
        const stats = await client.query(api.users.getOrgUserStats, { clerkId: userId, orgId });
        clientCount = stats.byRole?.client || 0;
      } catch {}

      return NextResponse.json({
        type,
        orgId,
        filters: { startDate, endDate },
        data: { users: Object.values(byUser), clientCount },
        generatedAt: Date.now(),
      });
    }

    return NextResponse.json({ type, orgId, data: {}, generatedAt: Date.now() });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
