import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
  publicRoutes: ["/", "/api/webhooks/clerk", "/api/get-user-role"],
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*) ", "/", "/(api|trpc)(.*)"],
};