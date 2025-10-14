import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req) {
  try {
    const { userId, message } = await req.json();
    const notification = await prisma.notification.create({
      data: {
        userId: userId,
        message: message,
      },
    });
    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ message: 'Error creating notification' }, { status: 500 });
  }
}
