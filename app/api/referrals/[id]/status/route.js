import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(request, { params }) {
  const { id } = params;
  const { status } = await request.json();
  try {
    const { rows } = await pool.query(
      'UPDATE referrals SET status = $1, processed_date = CURRENT_DATE WHERE id = $2 RETURNING *',
      [status, id]
    );
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error updating referral status:', error);
    return NextResponse.json({ message: 'Error updating referral status' }, { status: 500 });
  }
}