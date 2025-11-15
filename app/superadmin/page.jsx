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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">SuperAdmin Overview</h2>
        <p className="text-gray-600">
          Manage all organizations, users, and system-wide settings
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Organizations</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {organizations?.length || 0}
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <span className="text-2xl">🏢</span>
            </div>
          </div>
          <Link
            href="/superadmin/organizations"
            className="text-blue-600 text-sm font-medium hover:underline mt-4 inline-block"
          >
            Manage Organizations →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {allUsers?.length || 0}
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <span className="text-2xl">👥</span>
            </div>
          </div>
          <Link
            href="/superadmin/accounts"
            className="text-green-600 text-sm font-medium hover:underline mt-4 inline-block"
          >
            Manage Accounts →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Organizations</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {organizations?.filter((org) => org.status === "active").length || 0}
              </p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/superadmin/organizations/create"
            className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <span className="text-2xl">➕</span>
            <span className="font-medium text-blue-900">Create Organization</span>
          </Link>

          <Link
            href="/superadmin/accounts/create"
            className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <span className="text-2xl">👤</span>
            <span className="font-medium text-green-900">Create User Account</span>
          </Link>

          <Link
            href="/superadmin/audit-logs"
            className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <span className="text-2xl">📋</span>
            <span className="font-medium text-purple-900">View Audit Logs</span>
          </Link>

          <Link
            href="/superadmin/system"
            className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <span className="text-2xl">⚙️</span>
            <span className="font-medium text-orange-900">System Settings</span>
          </Link>
        </div>
      </div>

      {/* Recent Organizations */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Organizations</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {organizations?.slice(0, 5).map((org) => {
                const orgUsers = allUsers?.filter((u) => u.orgId === org.slug) || [];
                return (
                  <tr key={org._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{org.name}</div>
                      {org.description && (
                        <div className="text-sm text-gray-500">{org.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {orgUsers.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/superadmin/organizations/${org.slug}`}
                        className="text-indigo-600 hover:text-indigo-900"
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
        {organizations && organizations.length > 5 && (
          <div className="mt-4 text-center">
            <Link
              href="/superadmin/organizations"
              className="text-indigo-600 hover:underline text-sm font-medium"
            >
              View all organizations →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
