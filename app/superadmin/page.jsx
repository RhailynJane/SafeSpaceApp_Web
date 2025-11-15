"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";

export default function SuperAdminPage() {
  const { user } = useUser();
  const organizations = useQuery(
    api.organizations.list,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const allUsers = useQuery(
    api.users.list,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Filter out safespace organization (hidden system org)
  const visibleOrganizations = organizations?.filter((org) => org.slug !== "safespace") || [];
  const visibleUsers = allUsers?.filter((u) => u.orgId !== "safespace") || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">SuperAdmin Overview</h2>
        <p className="text-muted-foreground">
          Manage all organizations, users, and system-wide settings
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Organizations</p>
              <p className="text-3xl font-bold mt-2">
                {visibleOrganizations.length}
              </p>
            </div>
            <div className="bg-emerald-50 rounded-full p-3 dark:bg-emerald-900/20">
              <span className="text-2xl">🏢</span>
            </div>
          </div>
          <Link
            href="/superadmin/organizations"
            className="text-emerald-700 dark:text-emerald-300 text-sm font-medium hover:underline mt-4 inline-block"
          >
            Manage Organizations →
          </Link>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <p className="text-3xl font-bold mt-2">
                {visibleUsers.length}
              </p>
            </div>
            <div className="bg-emerald-50 rounded-full p-3 dark:bg-emerald-900/20">
              <span className="text-2xl">👥</span>
            </div>
          </div>
          <Link
            href="/superadmin/accounts"
            className="text-emerald-700 dark:text-emerald-300 text-sm font-medium hover:underline mt-4 inline-block"
          >
            Manage Accounts →
          </Link>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Organizations</p>
              <p className="text-3xl font-bold mt-2">
                {visibleOrganizations.filter((org) => org.status === "active").length}
              </p>
            </div>
            <div className="bg-emerald-50 rounded-full p-3 dark:bg-emerald-900/20">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/superadmin/organizations/create"
            className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <span className="text-2xl">➕</span>
            <span className="font-medium">Create Organization</span>
          </Link>

          <Link
            href="/superadmin/accounts/create"
            className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <span className="text-2xl">👤</span>
            <span className="font-medium">Create User Account</span>
          </Link>

          <Link
            href="/superadmin/audit-logs"
            className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <span className="text-2xl">📋</span>
            <span className="font-medium">View Audit Logs</span>
          </Link>

          <Link
            href="/superadmin/system"
            className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <span className="text-2xl">⚙️</span>
            <span className="font-medium">System Settings</span>
          </Link>
        </div>
      </div>

      {/* Recent Organizations */}
      <div className="bg-card rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Organizations</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleOrganizations.slice(0, 5).map((org) => {
                const orgUsers = visibleUsers.filter((u) => u.orgId === org.slug);
                return (
                  <tr key={org._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">{org.name}</div>
                      {org.description && (
                        <div className="text-sm text-muted-foreground">{org.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {org.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          org.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {org.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {orgUsers.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/superadmin/organizations/${org.slug}`}
                        className="text-emerald-700 hover:underline dark:text-emerald-300"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {visibleOrganizations.length > 5 && (
          <div className="mt-4 text-center">
            <Link
              href="/superadmin/organizations"
              className="text-emerald-700 hover:underline text-sm font-medium dark:text-emerald-300"
            >
              View all organizations →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
