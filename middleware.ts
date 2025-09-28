// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const protectAdmin = createRouteMatcher(["/admin(.*)"]);
const protectDashboard = createRouteMatcher(["/dashboard(.*)", "/referrals(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { isAuthenticated, sessionClaims, redirectToSignIn } = await auth();

  // Protect dashboard/referrals
  if (protectDashboard(req)) {
    if (!isAuthenticated) return redirectToSignIn();
  }

  // Protect admin
  if (protectAdmin(req)) {
    if (!isAuthenticated) return redirectToSignIn();
    if (sessionClaims?.metadata?.role !== "admin") {
      const url = new URL("/", req.url); // redirect home if not admin
      return NextResponse.redirect(url);
    }
  }
}, {
  publicRoutes: ["/", "/sign-in"]
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js|png|jpg|svg|woff2?|ico)).*)",
    "/(api|trpc)(.*)",
  ],
};
