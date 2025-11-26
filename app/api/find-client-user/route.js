import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Use the existing getByEmail query to find the user
    const user = await client.query(api.users.getByEmail, { 
      clerkId: userId, 
      email: email 
    });

    if (!user || user.roleId !== 'client') {
      return NextResponse.json({ error: 'Client user not found' }, { status: 404 });
    }

    return NextResponse.json({
      clerkId: user.clerkId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    });

  } catch (error) {
    console.error('Error finding client user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}