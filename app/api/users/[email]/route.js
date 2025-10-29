import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  const { email } = params;

  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });

  if (user) {
    return NextResponse.json({ userId: user.clerk_user_id });
  } else {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
}