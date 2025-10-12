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
    await auth.protect();
  }

  if (isAdminRoute(req)) {
    const { sessionClaims } = await auth();
    
    // FIXED: Changed from metadata.role to publicMetadata.role
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
  }
});

// tell Next.js which routes the middleware should run on
export const config = {
  matcher: [
    '/((?!.*\..*|_next).*)',
    '/api/:path*',
  ],
};


