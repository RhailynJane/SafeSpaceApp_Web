import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const reports = await prisma.report.findMany({ orderBy: { date: 'desc' } });
    return NextResponse.json(reports);
  } catch (error) {
    console.error("[REPORTS_GET_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}