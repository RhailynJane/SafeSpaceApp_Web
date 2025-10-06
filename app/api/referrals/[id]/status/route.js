import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request, { params }) {
  const { id } = params;
  const { status, processed_by_user_id, assigned_to_user_id } = await request.json();
  try {
    // Use Prisma raw query to update fields atomically; preserve existing columns
    const updated = await prisma.$queryRaw`
      UPDATE referrals
      SET status = ${status}, processed_date = CURRENT_DATE, processed_by_user_id = ${processed_by_user_id}
      ${assigned_to_user_id ? prisma.$queryRaw` , assigned_to_user_id = ${assigned_to_user_id}` : ''}
      WHERE id = ${Number(id)}
      RETURNING *
    `;

    // prisma.$queryRaw returns an array of results for some drivers
    const result = Array.isArray(updated) ? updated[0] : updated;
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating referral status:', error);
    return NextResponse.json({ message: 'Error updating referral status' }, { status: 500 });
  }
}
