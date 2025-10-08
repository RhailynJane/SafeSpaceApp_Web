import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const { id } = await params; // FIXED: Await params
    
    const timeline = await prisma.timeline.findMany({
      where: {
        referral_id: Number(id)
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    const timelineData = timeline.map(entry => ({
      status: entry.message.includes('submitted') ? 'SUBMITTED' : 
              entry.message.includes('Pending') ? 'PENDING' :
              entry.message.includes('Accepted') ? 'ACCEPTED' :
              entry.message.includes('Declined') ? 'REJECTED' : 'IN REVIEW',
      created_at: entry.created_at.toISOString(),
      note: entry.message,
      icon: entry.message.includes('submitted') ? 'ClockIcon' :
            entry.message.includes('Accepted') ? 'CheckCircleIcon' :
            entry.message.includes('Declined') ? 'XCircleIcon' : 'EyeIcon'
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