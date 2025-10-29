// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Import prisma

const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isDashboardRoute = createRouteMatcher(['/dashboard(.*)', '/interactive(.*)']);
const isApiRoute = createRouteMatcher(['/api(.*)']);

export default clerkMiddleware(async (auth, req) => {
  // Protect API routes
  if (isApiRoute(req)) {
    await auth.protect();
  }

  if (isDashboardRoute(req)) {
    const { sessionClaims } = await auth();
    console.log('Middleware - Session Claims for Dashboard Route:', sessionClaims);
    const role = sessionClaims?.publicMetadata?.role;

    if (role === 'admin') {
      const adminUrl = new URL('/admin/overview', req.url);
      return NextResponse.redirect(adminUrl);
    }

    await auth.protect();
  }

  if (isAdminRoute(req)) {
    console.log('isAdminRoute: true');
    const { userId } = auth(); // Get userId directly
    console.log('isAdminRoute: userId', userId);
    if (!userId) {
      console.log('isAdminRoute: No userId, redirecting to home');
      const homeUrl = new URL('/', req.url);
      return NextResponse.redirect(homeUrl);
    }

    // Fetch user role directly from the database
    const user = await prisma.user.findUnique({
      where: { clerk_user_id: userId },
      include: { roles: true },
    });
    console.log('isAdminRoute: user from DB', user);

    const role = user?.roles?.role_name; // Get role from database
    console.log('isAdminRoute: role', role);
    
    if (role !== 'admin') {
      const unauthorizedUrl = new URL('/unauthorized', req.url);
      return new Response(null, {
        status: 307,
        headers: { Location: unauthorizedUrl.toString() },
      });
    }

    // Redirect from /admin to /admin/overview
const path = req.nextUrl.pathname.replace(/\/$/, '');
console.log('isAdminRoute: path', path);
if (path === '/admin') {
  console.log('isAdminRoute: Redirecting from /admin to /admin/overview');
  const overviewUrl = new URL('/admin/overview', req.url);
  return NextResponse.redirect(overviewUrl);
}


    console.log('isAdminRoute: Protecting route');
    await auth.protect();
  }
});

// tell Next.js which routes the middleware should run on
export const config = {
  matcher: [
    '/((?!.*\..*|_next).*)',
    '/api/:path*',
  ],
};


