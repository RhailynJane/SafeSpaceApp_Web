"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { redirect } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SuperAdminLayout({ children }) {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();

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

  const navItems = [
    { href: "/superadmin", label: "Overview", exact: true },
    { href: "/superadmin/organizations", label: "Organizations" },
    { href: "/superadmin/accounts", label: "Account Management" },
    { href: "/superadmin/audit-logs", label: "Audit Logs" },
    { href: "/superadmin/system", label: "System Health" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <nav className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex space-x-1 p-2">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <main>{children}</main>
      </div>
    </div>
  );
}
