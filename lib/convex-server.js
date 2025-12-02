// Server-side Convex utilities
import { ConvexHttpClient } from "convex/browser";
import { auth } from "@clerk/nextjs/server";

// Server-side helper to get authenticated Convex client
export async function getConvexClient() {
  const { getToken } = await auth();
  let token = null;
  try {
    const template = process.env.CLERK_JWT_TEMPLATE_NAME || "convex";
    token = await getToken({ template });
  } catch (e) {
    console.warn("Clerk getToken failed; proceeding without template token:", e?.message || e);
    // Fallback to default session token if available
    try {
      token = await getToken();
    } catch (_) {
      token = null;
    }
  }
  
  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
  if (token) client.setAuth(token);
  return client;
}