import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await pool.query('SELECT * FROM referrals WHERE status = \'pending\'');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching referrals:', error);
    return NextResponse.json({ message: 'Error fetching referrals' }, { status: 500 });
  }
}

export async function POST(request) {
  const { 
    client_name, 
    age, 
    phone, 
    address, 
    email, 
    emergency_contact, 
    referral_source, 
    priority_level, 
    reason_for_referral, 
    additional_notes 
  } = await request.json();

  try {
    const { rows } = await pool.query(
      'INSERT INTO referrals (client_name, age, phone, address, email, emergency_contact, referral_source, priority_level, reason_for_referral, additional_notes, submitted_date, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE, \'pending\') RETURNING *',
      [client_name, age, phone, address, email, emergency_contact, referral_source, priority_level, reason_for_referral, additional_notes]
    );
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error creating referral:', error);
    return NextResponse.json({ message: 'Error creating referral' }, { status: 500 });
  }
}
