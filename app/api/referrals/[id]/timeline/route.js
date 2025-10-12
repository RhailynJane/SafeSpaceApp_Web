
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  // In a real application, you would fetch the timeline from the database
  // based on the referral ID (params.id).
  const timelineData = [
      { status: 'SUBMITTED', created_at: '2025-08-10 09:30:00', actor: 'admin@safespace.com', note: 'Referral submitted via OCR processing from fax document', icon: 'ClockIcon' },
      { status: 'PENDING', created_at: '2025-08-10 09:31:00', actor: 'System', note: 'Referral queued for team leader review', icon: 'ClockIcon' },
      { status: 'IN REVIEW', created_at: '2025-08-10 10:00:00', actor: 'Eric Young', note: 'Team leader reviewing referral details', icon: 'EyeIcon' },
      { status: 'ACCEPTED', created_at: '2025-08-10 10:05:00', actor: 'Eric Young', note: 'Referral accepted and assigned to support worker', icon: 'CheckCircleIcon' },
  ];

  return NextResponse.json(timelineData);
}
