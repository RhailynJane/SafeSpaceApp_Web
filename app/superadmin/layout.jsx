"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { redirect } from "next/navigation";
import Link from "next/link";
import SuperAdminSidebar from "@/components/superadmin/Sidebar";

export default function SuperAdminLayout({ children }) {
  const { user, isLoaded } = useUser();

  // Get current user's role from Convex
  const currentUser = useQuery(
    api.auth.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Debug logging
  console.log("SuperAdmin Layout Debug:", {
    isLoaded,
    userId: user?.id,
    userEmail: user?.emailAddresses?.[0]?.emailAddress,
    currentUser,
    roleId: currentUser?.roleId,
  });

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    redirect("/");
  }

  // Show loading state while checking user role
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent mb-4"></div>
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Check if user is SuperAdmin
  if (currentUser.roleId !== "superadmin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this area.</p>
          <Link href="/dashboard" className="text-blue-600 hover:underline mt-4 inline-block">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Full-bleed grid so the sidebar hugs the left edge */}
      <div className="grid grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)] gap-0">
        <aside className="hidden md:block md:sticky md:top-16 self-start h-[calc(100vh-64px)] overflow-y-auto p-4 border-r bg-background">
          <SuperAdminSidebar />
        </aside>
        <main className="min-w-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
