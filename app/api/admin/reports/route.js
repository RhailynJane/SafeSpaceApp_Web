import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await pool.query('SELECT * FROM reports ORDER BY report_date DESC');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ message: 'Error fetching reports' }, { status: 500 });
  }
}
