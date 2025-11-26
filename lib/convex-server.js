// Server-side Convex utilities
import { ConvexHttpClient } from "convex/browser";
import { auth } from "@clerk/nextjs/server";

// Server-side helper to get authenticated Convex client
export async function getConvexClient() {
  const { getToken } = await auth();
  const token = await getToken({ template: "convex" });
  
  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
  client.setAuth(token);
  return client;
}