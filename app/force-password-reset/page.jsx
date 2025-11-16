"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForcePasswordResetPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const mustChange = user?.publicMetadata?.mustChangePassword === true;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    if (!user) return;

    setLoading(true);
    try {
      // Update password using Clerk client SDK
      await user.updatePassword({
        currentPassword: currentPassword || undefined,
        newPassword,
        signOutOfOtherSessions: true,
      });

      // Update public metadata to clear flag and set timestamp
      await user.update({
        publicMetadata: {
          ...(user.publicMetadata || {}),
          mustChangePassword: false,
          passwordChangedAt: new Date().toISOString(),
        },
      });

      setSuccess("Password updated successfully.");

      // Redirect based on role after a short delay
      const role = user?.publicMetadata?.role;
      setTimeout(() => {
        if (role === "admin") router.replace("/admin/overview");
        else if (role === "superadmin") router.replace("/superadmin");
        else router.replace("/dashboard");
      }, 800);
    } catch (err) {
      const msg = err?.errors?.[0]?.message || err?.message || "Failed to update password";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-10 px-4">
      <div className="bg-card border rounded-lg p-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Update Your Password</h1>
          <p className="text-sm text-muted-foreground">
            {mustChange
              ? "For security, you must set a new password before continuing."
              : "For your role, passwords must be rotated every 30 days."}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            <p className="font-medium">Password Update Failed</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-lg">
            <p className="font-medium">Success</p>
            <p className="text-sm mt-1">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground"
              placeholder="Enter current or temporary password"
              autoComplete="current-password"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground"
              placeholder="Choose a strong password"
              autoComplete="new-password"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground"
              placeholder="Re-enter new password"
              autoComplete="new-password"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Link href="/sign-out" className="px-4 py-2 bg-card border rounded-lg">Cancel</Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
