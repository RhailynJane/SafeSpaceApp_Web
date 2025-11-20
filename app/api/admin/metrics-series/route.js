// app/api/admin/metrics-series/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { fetchQuery, fetchMutation } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { resolveUserRole } from '@/lib/security';
import { clerkClient } from '@clerk/clerk-sdk-node';

// In-memory lock to prevent concurrent writes to the same minute bucket
const writeLocks = new Map();

function parseWindow(param) {
  // Accept formats like "10m", "600s"; default to 10 samples regardless
  if (!param) return { samples: 10 };
  const m = String(param).match(/^(\d+)([smh])$/i);
  if (!m) return { samples: 10 };
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  const minutes = unit === 'h' ? n * 60 : unit === 'm' ? n : Math.round(n / 60);
  // 1 sample/minute, clamp 1..60
  return { samples: Math.max(1, Math.min(60, minutes)) };
}

export async function GET(req) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = await resolveUserRole(userId, sessionClaims);
    if (role !== 'admin' && role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const { samples } = parseWindow(url.searchParams.get('window'));

    // Resolve org context
    const currentUser = await fetchQuery(api.users.getByClerkId, { clerkId: userId });
    const orgId = currentUser?.orgId || null;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization associated with current user' }, { status: 400 });
    }

    // Current point-in-time values
    const [stats, sessionCount, health, clerkOk] = await Promise.all([
      fetchQuery(api.users.getOrgUserStats, { clerkId: userId, orgId }),
      fetchQuery(api.presence.onlineCountByOrg, { clerkId: userId, orgId, sinceMs: 6 * 60 * 1000 }),
      fetchQuery(api.systemHealth.getHealthStatus, {}),
      (async () => {
        try {
          await clerkClient.users.getCount();
          return true;
        } catch {
          return false;
        }
      })(),
    ]);

    const totalUsers = Number(stats?.total || 0);
    const uptimePct = 99.9; // If you have real uptime, plug it in
    const alerts = 0; // If you have real alerts series, plug it in
    const sessions = Number(sessionCount || 0);
    const dbOk = health?.database?.connected !== false && (health?.status === 'healthy' || (health?.database?.latency ?? 0) < 1000);

    const mk = (val) => Array(samples).fill(val);

    // Create snapshot for metrics
    const snapshot = {
      users: totalUsers,
      uptime: uptimePct,
      alerts,
      sessions,
      dbOk,
      authOk: Boolean(clerkOk),
      apiMs: Math.max(20, Math.min(500, Number(health?.database?.latency ?? 120))),
    };

    // Persist a per-minute bucket so we can build real series
    const minute = Math.floor(Date.now() / 60000) * 60000;
    const lockKey = `${orgId}:${minute}`;
    
    // Only write if no other request is currently writing to this bucket
    if (!writeLocks.has(lockKey)) {
      writeLocks.set(lockKey, true);
      
      try {
        await fetchMutation(api.metrics.upsertMetricsBucket, {
          orgId,
          minute,
          users: snapshot.users,
          sessions: snapshot.sessions,
          dbOk: snapshot.dbOk,
          authOk: snapshot.authOk,
          apiMs: snapshot.apiMs,
          alerts: snapshot.alerts,
          uptime: snapshot.uptime,
        });
      } catch (e) {
        console.warn('Failed to upsert metrics bucket:', e);
      } finally {
        // Clear lock after 5 seconds to prevent memory leak
        setTimeout(() => writeLocks.delete(lockKey), 5000);
      }
    }

    // Fetch recent series from Convex (newest->oldest), then build arrays
    let rows = [];
    try {
      rows = await fetchQuery(api.metrics.seriesByOrg, { orgId, limit: samples });
    } catch (e) {
      console.warn('Failed to fetch metrics series from Convex, falling back to seeded arrays:', e);
    }

    const newestToOldest = Array.isArray(rows) ? rows : [];
    const ordered = newestToOldest.slice(0, samples).reverse(); // oldest->newest
    const pad = (arr, val) => {
      if (arr.length >= samples) return arr;
      const padCount = samples - arr.length;
      return Array(padCount).fill(val).concat(arr);
    };

    const usersArr = ordered.map(r => r.users);
    const uptimeArr = ordered.map(r => r.uptime);
    const alertsArr = ordered.map(r => r.alerts);
    const sessionsArr = ordered.map(r => r.sessions);
    const dbOkArr = ordered.map(r => r.dbOk);
    const authOkArr = ordered.map(r => r.authOk);
    const apiMsArr = ordered.map(r => r.apiMs);

    const body = {
      users: usersArr.length ? pad(usersArr, snapshot.users) : mk(snapshot.users),
      uptime: uptimeArr.length ? pad(uptimeArr, snapshot.uptime) : mk(snapshot.uptime),
      alerts: alertsArr.length ? pad(alertsArr, snapshot.alerts) : mk(snapshot.alerts),
      sessions: sessionsArr.length ? pad(sessionsArr, snapshot.sessions) : mk(snapshot.sessions),
      dbOk: dbOkArr.length ? pad(dbOkArr, snapshot.dbOk) : mk(snapshot.dbOk),
      authOk: authOkArr.length ? pad(authOkArr, snapshot.authOk) : mk(snapshot.authOk),
      apiMs: apiMsArr.length ? pad(apiMsArr, snapshot.apiMs) : mk(snapshot.apiMs),
    };

    const res = NextResponse.json(body);
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error('Error in metrics-series:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics series', details: error.message }, { status: 500 });
  }
}
