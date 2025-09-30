import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await pool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ message: 'Error fetching audit logs' }, { status: 500 });
  }
}
