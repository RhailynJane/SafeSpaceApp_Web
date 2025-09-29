
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';

export async function GET() {
  try {
    const { rows } = await pool.query('SELECT id, first_name, last_name, email, last_login, created_at, status FROM users');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ message: 'Error fetching users' }, { status: 500 });
  }
}

export async function POST(request) {
  const { firstName, lastName, email, password, role } = await request.json();
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const { rows } = await pool.query(
      'INSERT INTO users (first_name, last_name, email, password_hash, role, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, first_name, last_name, email, role, status',
      [firstName, lastName, email, hashedPassword, role, 'Active']
    );
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ message: 'Error creating user' }, { status: 500 });
  }
}

export async function PUT(request) {
    // to be added in the future
}
