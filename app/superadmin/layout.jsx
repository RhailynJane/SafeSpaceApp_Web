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

  // Check if user is SuperAdmin
  if (currentUser && currentUser.roleId !== "superadmin") {
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
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">👑</span>
              <h1 className="text-xl font-bold">SuperAdmin Portal</h1>
            </div>
            <div className="text-sm">
              {user.firstName} {user.lastName}
            </div>
          </div>
        </div>
      </div>

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
