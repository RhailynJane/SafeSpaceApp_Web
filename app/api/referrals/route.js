import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await pool.query('SELECT * FROM referrals');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching referrals:', error);
    return NextResponse.json({ message: 'Error fetching referrals' }, { status: 500 });
  }
}