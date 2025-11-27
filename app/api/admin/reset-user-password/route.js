// app/api/admin/reset-user-password/route.js
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { sanitizeInput, createErrorResponse, checkRateLimit } from '@/lib/security';

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting: max 5 password resets per minute per user
    if (!checkRateLimit(`reset-password:${userId}`, 5, 60000)) {
      return createErrorResponse('Rate limit exceeded. Please try again later.', 429);
    }

    const { newPassword } = await req.json();

    // Validate password strength
    if (!newPassword || typeof newPassword !== 'string') {
      return createErrorResponse('Password is required', 400);
    }

    if (newPassword.length < 8) {
      return createErrorResponse('Password must be at least 8 characters', 400);
    }

    if (newPassword.length > 128) {
      return createErrorResponse('Password must not exceed 128 characters', 400);
    }

    // Check password complexity (at least one uppercase, one lowercase, one number)
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return createErrorResponse(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        400
      );
    }

    // Use Clerk Admin API to set password (bypasses current password requirement)
    const response = await fetch(`https://api.clerk.com/v1/users/${userId}/password`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password: newPassword,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Clerk password reset error:', error);
      throw new Error(error.errors?.[0]?.message || 'Failed to reset password');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return createErrorResponse(error.message || 'Failed to reset password', 500);
  }
}
