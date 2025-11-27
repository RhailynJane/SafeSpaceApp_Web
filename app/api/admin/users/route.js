import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { resolveUserRole, createErrorResponse } from '@/lib/security';
import bcrypt from 'bcrypt'

/**
 * @file This API route handles fetching all users and creating a new user.
 * It is intended for admin use.
 */

/**
 * Handles GET requests to fetch all users from the database.
 * @returns {NextResponse} A JSON response with the list of users or an error message.
 */
export async function GET(request) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = await resolveUserRole(userId, sessionClaims);
    if (role !== 'admin' && role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Optional status filter (used to request deleted users)
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    // Fetch users via Convex; authorization is enforced in the query
    // Pass includeDeleted flag to get all users (including deleted) when needed
    // NOTE: The users.list query already includes clients merged in, so no need to fetch separately
    const convexUsers = await fetchQuery(api.users.list, { 
      clerkId: userId, 
      status: status,
      includeDeleted: includeDeleted 
    });

    // Map Convex users (which already includes clients) to legacy shape expected by the admin users table
    const users = (convexUsers || []).map((u) => {
      // Determine if this is a client (no clerkId means it's a client)
      const isClient = !u.clerkId;
      
      return {
        id: u.clerkId || u._id, // use Clerk ID for users, Convex ID for clients
        first_name: u.firstName || '',
        last_name: u.lastName || '',
        email: u.email || '',
        last_login: u.lastLogin ? new Date(u.lastLogin).toISOString() : 'N/A',
        created_at: u.createdAt ? new Date(u.createdAt).toISOString() : '',
        status: (u.status || 'active').charAt(0).toUpperCase() + (u.status || 'active').slice(1),
        role: { role_name: u.roleId || '' },
        isClient: isClient
      };
    });

    // Deduplicate by ID (in case there are any duplicates from the query)
    const uniqueUsers = users.reduce((acc, user) => {
      if (!acc.find(u => u.id === user.id)) {
        acc.push(user);
      }
      return acc;
    }, []);

    console.log(`Fetched ${users.length} users, deduplicated to ${uniqueUsers.length}`);

    return NextResponse.json(uniqueUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return createErrorResponse('Error fetching users', 500, error.message);
  }
}

/**
 * Handles POST requests to create a new user in the database.
 * @param {Request} request - The incoming HTTP request.
 * @returns {NextResponse} A JSON response with the newly created user or an error message.
 */
export async function POST(request) {
  // This legacy endpoint is deprecated; use /api/admin/create-user instead which orchestrates Clerk + Convex
  return NextResponse.json(
    { error: 'Deprecated: use POST /api/admin/create-user' },
    { status: 410 }
  );
}

/**
 * Placeholder for handling PUT requests to update a user.
 * This functionality is not yet implemented.
 * @param {Request} request - The incoming HTTP request.
 */
export async function PUT(request) {
  // to be added in the future
}