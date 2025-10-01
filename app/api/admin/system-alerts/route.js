import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await pool.query('SELECT * FROM system_alerts ORDER BY timestamp DESC');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching system alerts:', error);
    return NextResponse.json({ message: 'Error fetching system alerts' }, { status: 500 });
  }
}
