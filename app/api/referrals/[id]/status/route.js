// app/api/referrals/[id]/status/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth, currentUser } from "@clerk/nextjs/server";

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const { status, note } = await request.json();

    // Get the database user ID
    const dbUser = await prisma.user.findUnique({
      where: { clerk_user_id: userId }
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    // Update the referral
    const updated = await prisma.referral.update({
      where: { id: Number(id) },
      data: {
        status,
        processed_date: new Date(),
        processed_by_user_id: dbUser.id,
      },
      include: {
        processed_by: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          }
        }
      }
    });

    // Create timeline entry
    await prisma.timeline.create({
      data: {
        referralId: Number(id),
        message: note || `Status changed to ${status} by ${dbUser.first_name} ${dbUser.last_name}`,
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating referral status:', error);
    return NextResponse.json({ 
      message: 'Error updating referral status',
      error: error.message 
    }, { status: 500 });
  }
}