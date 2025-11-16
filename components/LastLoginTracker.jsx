"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function LastLoginTracker() {
  const { user, isSignedIn, isLoaded } = useUser();
  const updateLastLogin = useMutation(api.users.updateLastLogin);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) return;
    const today = new Date().toISOString().slice(0, 10);
    const key = `lastLoginUpdated:${user.id}:${today}`;
    if (sessionStorage.getItem(key)) return;

    (async () => {
      try {
        await updateLastLogin({ clerkId: user.id });
        sessionStorage.setItem(key, "1");
      } catch (e) {
        // Non-blocking; silently ignore failure
        console.warn("Failed to update last login:", e);
      }
    })();
  }, [isLoaded, isSignedIn, user?.id, updateLastLogin]);

  return null;
}
