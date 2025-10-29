// app/api/admin/ping/route.js
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized: No user ID in request" }), { status: 401 });
    }

    return NextResponse.json({ message: 'pong' });
  } catch (error) {
    console.error('Error in ping endpoint:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
