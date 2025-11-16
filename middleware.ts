// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
// Note: Prisma removed during Convex migration - role checks now use Clerk metadata

const isAdminRoute = createRouteMatcher(['/admin(.*)', '/superadmin(.*)']);
const isDashboardRoute = createRouteMatcher(['/dashboard(.*)', '/interactive(.*)']);
const isApiRoute = createRouteMatcher(['/api(.*)']);
const isAuthOrResetRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/force-password-reset(.*)',
]);
const isStaticOrNext = createRouteMatcher([
  '/_next(.*)',
  '/favicon.ico',
  '/images(.*)',
  '/public(.*)'
]);

// Roles that must rotate passwords every 30 days
const ROTATION_ROLES = new Set(['admin', 'team_leader', 'support_worker', 'peer_support']);

function daysBetween(a: number, b: number) {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.floor((b - a) / MS_PER_DAY);
}

export default clerkMiddleware(async (auth, req) => {
  // Protect API routes
  if (isApiRoute(req)) {
    await auth.protect();
  }

  // Enforce password change policy for all authenticated pages (except auth/reset/static)
  if (!isApiRoute(req) && !isAuthOrResetRoute(req) && !isStaticOrNext(req)) {
    const { userId, sessionClaims } = await auth();
    if (userId) {
      try {
        // Prefer fresh data from Clerk (public_metadata)
        const clerkUserResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
          headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
        });
        let role: string | undefined;
        let mustChange = false;
        let passwordChangedAt: string | undefined;

        if (clerkUserResponse.ok) {
          const clerkUser = await clerkUserResponse.json();
          const pm = (clerkUser as any).public_metadata || {};
          role = pm.role;
          mustChange = Boolean(pm.mustChangePassword);
          passwordChangedAt = pm.passwordChangedAt;
        } else {
          // Fallback to session claims if API call fails
          const pm = (sessionClaims as any)?.publicMetadata || {};
          role = pm.role;
          mustChange = Boolean(pm.mustChangePassword);
          passwordChangedAt = pm.passwordChangedAt;
        }

        const now = Date.now();
        let expired = false;
        if (passwordChangedAt && ROTATION_ROLES.has(role || '')) {
          const last = Date.parse(passwordChangedAt);
          if (!Number.isNaN(last)) {
            expired = daysBetween(last, now) >= 30;
          }
        }

        if (mustChange || expired) {
          const resetUrl = new URL('/force-password-reset', req.url);
          return NextResponse.redirect(resetUrl);
        }
      } catch (e) {
        // On error, do not block navigation but log for investigation
        console.warn('Password policy check failed in middleware:', e);
      }
    }
  }

  if (isDashboardRoute(req)) {
    const { userId } = await auth();
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
      const role = (sessionClaims as any)?.publicMetadata?.role;
      if (role === 'admin') {
        const adminUrl = new URL('/admin/overview', req.url);
        return NextResponse.redirect(adminUrl);
      }
      await auth.protect();
      return;
    }

    const clerkUser = await clerkUserResponse.json();
    const role = (clerkUser as any).public_metadata?.role;

    if (role === 'admin') {
      const adminUrl = new URL('/admin/overview', req.url);
      return NextResponse.redirect(adminUrl);
    }

    await auth.protect();
  }

  if (isAdminRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      // If no userId, protect the route and let Clerk handle unauthenticated users
      await auth.protect();
      return;
    }

    // Fetch user role from Clerk metadata (replace Prisma DB check during Convex migration)
    const clerkUserResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    });

    if (!clerkUserResponse.ok) {
      console.error("Failed to fetch user data from Clerk in middleware for admin route.");
      // Block access if we can't verify role
      const unauthorizedUrl = new URL('/unauthorized', req.url);
      return new Response(null, {
        status: 307,
        headers: { Location: unauthorizedUrl.toString() },
      });
    }

    const clerkUser = await clerkUserResponse.json();
    const role = (clerkUser as any).public_metadata?.role;
    console.log('isAdminRoute: role from Clerk metadata', role);
    
    if (role !== 'admin' && role !== 'superadmin') {
      const unauthorizedUrl = new URL('/unauthorized', req.url);
      return new Response(null, {
        status: 307,
        headers: { Location: unauthorizedUrl.toString() },
      });
    }

    // Redirect from /admin to /admin/overview
    const path = req.nextUrl.pathname.replace(/\/$/, '');
    if (path === '/admin') {
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