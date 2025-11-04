// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isDashboardRoute = createRouteMatcher(['/dashboard(.*)', '/interactive(.*)']);
const isApiRoute = createRouteMatcher(['/api(.*)']);

export default clerkMiddleware(async (auth, req) => {
  // Protect API routes
  if (isApiRoute(req)) {
    await auth.protect();
  }

  if (isDashboardRoute(req)) {
    const { userId } = auth();
    if (!userId) {
      // If no userId, protect the route and let Clerk handle unauthenticated users
      await auth.protect();
      return;
    }

    // Fetch the user's details directly from Clerk to get the freshest public_metadata
    const clerkUserResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    });

    if (!clerkUserResponse.ok) {
      console.error("Failed to fetch user data from Clerk in middleware for dashboard route.");
      // Fallback to sessionClaims if direct fetch fails, or redirect to error page
      const { sessionClaims } = await auth();
      const role = sessionClaims?.publicMetadata?.role;
      if (role === 'admin') {
        const adminUrl = new URL('/admin/overview', req.url);
        return NextResponse.redirect(adminUrl);
      }
      await auth.protect();
      return;
    }

    const clerkUser = await clerkUserResponse.json();
    const role = clerkUser.public_metadata?.role;

    if (role === 'admin') {
      const adminUrl = new URL('/admin/overview', req.url);
      return NextResponse.redirect(adminUrl);
    }

    await auth.protect();
  }

  if (isAdminRoute(req)) {
    const { userId } = auth();
    if (!userId) {
      // If no userId, protect the route and let Clerk handle unauthenticated users
      await auth.protect();
      return;
    }

    // Fetch the user's details directly from Clerk to get the freshest public_metadata
    const clerkUserResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    });

    if (!clerkUserResponse.ok) {
      console.error("Failed to fetch user data from Clerk in middleware for admin route.");
      // Fallback to sessionClaims if direct fetch fails, or redirect to home
      const { sessionClaims } = await auth();
      const role = sessionClaims?.publicMetadata?.role;
      if (role !== 'admin') {
        const homeUrl = new URL('/', req.url);
        return NextResponse.redirect(homeUrl);
      }
      // Redirect from /admin to /admin/overview
      const path = req.nextUrl.pathname.replace(/\/$/, '');
      if (path === '/admin') {
        const overviewUrl = new URL('/admin/overview', req.url);
        return NextResponse.redirect(overviewUrl);
      }
      await auth.protect();
      return;
    }

    const clerkUser = await clerkUserResponse.json();
    const role = clerkUser.public_metadata?.role;

    if (role !== 'admin') {
      const homeUrl = new URL('/', req.url);
      return NextResponse.redirect(homeUrl);
    }

    // Redirect from /admin to /admin/overview
    const path = req.nextUrl.pathname.replace(/\/$/, '');
    if (path === '/admin') {
      const overviewUrl = new URL('/admin/overview', req.url);
      return NextResponse.redirect(overviewUrl);
    }

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


