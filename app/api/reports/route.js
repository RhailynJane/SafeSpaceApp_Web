import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// This route is deprecated after Convex migration.
// Keeping a stub to avoid build-time Prisma imports and duplicate handlers.

export async function POST() {
  return NextResponse.json({ message: 'Reports API deprecated. Generate reports client-side.' }, { status: 410 });
}