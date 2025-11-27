"use client";

import { useEffect } from "react";

/**
 * Invite landing page.
 * On mobile, this auto-redirects to Clerk sign-in to set password.
 * The user was already created by /api/clients/invite.
 */
export default function InviteLandingPage() {
  useEffect(() => {
    // Redirect to sign-in page where user can set password
    // The mustChangePassword flag will prompt password setup
    const redirectTo = "/sign-in?redirect_url=/workspace";
    window.location.href = redirectTo;
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full border border-border rounded-xl p-6 bg-card shadow">
        <h1 className="text-xl font-semibold text-card-foreground mb-2">Welcome to SafeSpace</h1>
        <p className="text-sm text-muted-foreground">
          Redirecting you to create your password...
        </p>
      </div>
    </main>
  );
}
