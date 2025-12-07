// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
// Note: Prisma removed during Convex migration - role checks now use Clerk metadata

const isAdminRoute = createRouteMatcher(['/admin(.*)', '/superadmin(.*)']);
const isDashboardRoute = createRouteMatcher(['/dashboard(.*)', '/workspace(.*)']);
const isApiRoute = createRouteMatcher(['/api(.*)']);
const isAuthOrResetRoute = createRouteMatcher([
  '/',
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
  // Create response with security headers
  const response = NextResponse.next();
  
  // Add security headers to all responses
  response.headers.set('X-Frame-Options', 'DENY'); // Prevent clickjacking
  response.headers.set('X-Content-Type-Options', 'nosniff'); // Prevent MIME sniffing
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin'); // Control referrer info
  
  // Permissions Policy - Allow camera and microphone for Jitsi Meet video calling
  response.headers.set('Permissions-Policy', 'camera=(self "https://meet.jit.si"), microphone=(self "https://meet.jit.si"), display-capture=(self "https://meet.jit.si")');
  
  // Content Security Policy (CSP) - Adjust based on your needs
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://cdn.jsdelivr.net https://*.clerk.accounts.dev https://convex.cloud https://*.convex.cloud https://meet.jit.si",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.clerk.accounts.dev https://clerk-telemetry.com https://convex.cloud https://*.convex.cloud wss://*.convex.cloud https://*.sendbird.com wss://*.sendbird.com https://meet.jit.si wss://meet.jit.si https://api.mapbox.com",
    "worker-src 'self' blob:",
    "frame-src 'self' https://meet.jit.si",
    "media-src 'self' blob: https://meet.jit.si",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));
  
  // Protect API routes
  if (isApiRoute(req)) {
    await auth.protect();
  }

  // Enforce password change policy for all authenticated pages (except auth/reset/static)
  // Can be disabled via ENFORCE_PASSWORD_POLICY=false in environment
  const enforcePasswordPolicy = (process.env.ENFORCE_PASSWORD_POLICY ?? 'true') !== 'false';
  if (enforcePasswordPolicy && !isApiRoute(req) && !isAuthOrResetRoute(req) && !isStaticOrNext(req)) {
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
          const redirectResponse = NextResponse.redirect(resetUrl);
          // Copy security headers to redirect response
          response.headers.forEach((value, key) => {
            redirectResponse.headers.set(key, value);
          });
          return redirectResponse;
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
      return response;
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
        const redirectResponse = NextResponse.redirect(adminUrl);
        response.headers.forEach((value, key) => {
          redirectResponse.headers.set(key, value);
        });
        return redirectResponse;
      }
      await auth.protect();
      return response;
    }

    const clerkUser = await clerkUserResponse.json();
    const role = (clerkUser as any).public_metadata?.role;

    if (role === 'admin') {
      const adminUrl = new URL('/admin/overview', req.url);
      const redirectResponse = NextResponse.redirect(adminUrl);
      response.headers.forEach((value, key) => {
        redirectResponse.headers.set(key, value);
      });
      return redirectResponse;
    }

    await auth.protect();
    return response;
  }

  if (isAdminRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      // If no userId, protect the route and let Clerk handle unauthenticated users
      await auth.protect();
      return response;
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
      const unauthorizedResponse = new Response(null, {
        status: 307,
        headers: { Location: unauthorizedUrl.toString() },
      });
      response.headers.forEach((value, key) => {
        unauthorizedResponse.headers.set(key, value);
      });
      return unauthorizedResponse;
    }

    const clerkUser = await clerkUserResponse.json();
    const role = (clerkUser as any).public_metadata?.role;
    console.log('isAdminRoute: role from Clerk metadata', role);
    
    if (role !== 'admin' && role !== 'superadmin') {
      const unauthorizedUrl = new URL('/unauthorized', req.url);
      const unauthorizedResponse = new Response(null, {
        status: 307,
        headers: { Location: unauthorizedUrl.toString() },
      });
      response.headers.forEach((value, key) => {
        unauthorizedResponse.headers.set(key, value);
      });
      return unauthorizedResponse;
    }

    // Redirect from /admin to /admin/overview
    const path = req.nextUrl.pathname.replace(/\/$/, '');
    if (path === '/admin') {
      const overviewUrl = new URL('/admin/overview', req.url);
      const redirectResponse = NextResponse.redirect(overviewUrl);
      response.headers.forEach((value, key) => {
        redirectResponse.headers.set(key, value);
      });
      return redirectResponse;
    }

    console.log('isAdminRoute: Protecting route');
    await auth.protect();
    return response;
  }

  return response;
});

// tell Next.js which routes the middleware should run on
export const config = {
  matcher: [
    '/((?!.*\..*|_next).*)',
    '/api/:path*',
  ],
};