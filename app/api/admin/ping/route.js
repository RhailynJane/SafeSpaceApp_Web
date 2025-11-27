// app/api/admin/ping/route.js
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { performance } from 'node:perf_hooks';

export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized: No user ID in request" }), { status: 401 });
    }

    const t0 = performance.now();
    // Minimal work; this route is used to measure end-to-end latency.
    const serverMs = performance.now() - t0;
    const res = NextResponse.json({ message: 'pong', serverMs });
    // Add Server-Timing header so clients can parse server processing time.
    res.headers.set('Server-Timing', `app;desc="API handler";dur=${serverMs.toFixed(1)}`);
    // Avoid caches affecting latency measure
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error('Error in ping endpoint:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
