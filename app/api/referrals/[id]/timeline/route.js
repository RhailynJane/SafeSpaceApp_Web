// app/api/referrals/[id]/timeline/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    const timeline = await prisma.timeline.findMany({
      where: {
        referralId: Number(id)
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Transform to match your UI expectations
    const timelineData = timeline.map(entry => ({
      status: entry.message.includes('submitted') ? 'SUBMITTED' : 
              entry.message.includes('Pending') ? 'PENDING' :
              entry.message.includes('Accepted') ? 'ACCEPTED' :
              entry.message.includes('Rejected') ? 'REJECTED' : 'IN REVIEW',
      created_at: entry.createdAt.toISOString(),
      note: entry.message,
      icon: entry.message.includes('submitted') ? 'ClockIcon' :
            entry.message.includes('Accepted') ? 'CheckCircleIcon' :
            entry.message.includes('Rejected') ? 'XCircleIcon' : 'EyeIcon'
    }));

    return NextResponse.json(timelineData);
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch timeline',
      details: error.message 
    }, { status: 500 });
  }
}