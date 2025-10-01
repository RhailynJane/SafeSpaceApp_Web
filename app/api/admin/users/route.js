import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';

/**
 * @file This API route handles fetching all users and creating a new user.
 * It is intended for admin use.
 */

/**
 * Handles GET requests to fetch all users from the database.
 * @returns {NextResponse} A JSON response with the list of users or an error message.
 */
export async function GET() {
  try {
    // Query the database to get a list of all users.
    // Note: We are excluding the password_hash for security reasons.
    const { rows } = await pool.query('SELECT id, first_name, last_name, email, role, last_login, created_at FROM users');
    
    // Return the fetched users as a JSON response with a 200 OK status.
    return NextResponse.json(rows);
  } catch (error) {
    // If there is an error during the database query, log the error to the console.
    console.error('Error fetching users:', error);
    
    // Return a JSON response with an error message and a 500 Internal Server Error status.
    return NextResponse.json({ message: 'Error fetching users' }, { status: 500 });
  }
}

/**
 * Handles POST requests to create a new user in the database.
 * @param {Request} request - The incoming HTTP request.
 * @returns {NextResponse} A JSON response with the newly created user or an error message.
 */
export async function POST(request) {
  // Parse the user data from the request body.
  const { firstName, lastName, email, password, role } = await request.json();
  
  // Hash the user's password for secure storage.
  const hashedPassword = await bcrypt.hash(password, 10);
  
  try {
    // Insert the new user into the users table.
    const { rows } = await pool.query(
      'INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, first_name, last_name, email, role',
      [firstName, lastName, email, hashedPassword, role]
    );
    
    // Return the newly created user as a JSON response with a 201 Created status.
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    // If there is an error during the database insertion, log the error to the console.
    console.error('Error creating user:', error);
    
    // Return a JSON response with an error message and a 500 Internal Server Error status.
    return NextResponse.json({ message: 'Error creating user' }, { status: 500 });
  }
}

/**
 * Placeholder for handling PUT requests to update a user.
 * This functionality is not yet implemented.
 * @param {Request} request - The incoming HTTP request.
 */
export async function PUT(request) {
    // to be added in the future
}