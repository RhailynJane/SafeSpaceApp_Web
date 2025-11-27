import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function GET(request, { params }) {
  const { email } = await params;

  try {
    const users = await clerkClient.users.getUserList({ emailAddress: [email] });

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Assuming the first user found is the correct one
    const user = users[0];

    return NextResponse.json({ userId: user.id });
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
