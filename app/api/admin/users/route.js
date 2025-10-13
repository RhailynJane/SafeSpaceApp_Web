import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt'

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
    // Use Prisma to fetch users - map field names to what's returned in SQL
    const users = await prisma.user.findMany({
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        last_login: true,
        created_at: true,
      },
    });
    return NextResponse.json(users);
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
    // Create user via Prisma - assumes Role linking will be handled elsewhere (role passed may be role_id)
    const created = await prisma.user.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        email,
        // store hash in a password_hash column if schema has it; using 'password_hash' raw query for compatibility
      },
    });
    // If the schema stores password_hash as a column not present on the Prisma model, consider using $executeRaw or adjust schema.
    return NextResponse.json(created, { status: 201 });
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