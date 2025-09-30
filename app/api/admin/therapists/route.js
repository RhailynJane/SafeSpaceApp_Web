import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await pool.query('SELECT id, first_name, last_name FROM users WHERE role = \'therapist\'');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching therapists:', error);
    return NextResponse.json({ message: 'Error fetching therapists' }, { status: 500 });
  }
}
