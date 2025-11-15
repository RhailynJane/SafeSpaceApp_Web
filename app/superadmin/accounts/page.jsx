"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { useState } from "react";

export default function AccountsPage() {
  const { user } = useUser();
  const [selectedOrg, setSelectedOrg] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const organizations = useQuery(
    api.organizations.list,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Filter out safespace organization (hidden system org)
  const visibleOrganizations = organizations?.filter(org => org.slug !== "safespace") || [];

  const roles = useQuery(api.roles.list);

  const users = useQuery(
    api.users.list,
    user?.id
      ? {
          clerkId: user.id,
          orgId: selectedOrg !== "all" ? selectedOrg : undefined,
          roleId: selectedRole !== "all" ? selectedRole : undefined,
          status: selectedStatus !== "all" ? selectedStatus : undefined,
        }
      : "skip"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Account Management</h2>
          <p className="text-muted-foreground">Manage user accounts across all organizations</p>
        </div>
        <Link
          href="/superadmin/accounts/create"
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
        >
          + Create Account
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Organization
            </label>
            <select
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">All Organizations</option>
              {visibleOrganizations.map((org) => (
                <option key={org._id} value={org.slug}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">All Roles</option>
              {roles?.map((role) => (
                <option key={role._id} value={role.slug}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="flex items-end">
            <div className="text-sm text-muted-foreground">
              {users?.length || 0} account(s) found
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users?.map((u) => {
                const org = visibleOrganizations.find((o) => o.slug === u.orgId);
                const role = roles?.find((r) => r.slug === u.roleId);

                return (
                  <tr key={u._id} className="hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className="font-medium">
                            {u.firstName} {u.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                        {role?.name || u.roleId}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {org?.name || u.orgId || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          u.status === "active"
                            ? "bg-green-100 text-green-800"
                            : u.status === "inactive"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {u.lastLogin
                        ? new Date(u.lastLogin).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Link
                        href={`/superadmin/accounts/${u.clerkId}`}
                        className="text-emerald-700 hover:underline dark:text-emerald-300"
                      >
                        View
                      </Link>
                      <Link
                        href={`/superadmin/accounts/${u.clerkId}/edit`}
                        className="text-emerald-700 hover:underline dark:text-emerald-300"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {users?.length === 0 && (
            <div className="text-center py-12">
              <span className="text-4xl mb-4 block">👥</span>
              <p className="text-muted-foreground">No accounts found</p>
              <Link
                href="/superadmin/accounts/create"
                className="text-emerald-700 hover:underline text-sm mt-2 inline-block dark:text-emerald-300"
              >
                Create your first account
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Total Accounts</div>
          <div className="text-2xl font-bold mt-1">
            {users?.length || 0}
          </div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Active</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {users?.filter((u) => u.status === "active").length || 0}
          </div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Inactive</div>
          <div className="text-2xl font-bold text-muted-foreground mt-1">
            {users?.filter((u) => u.status === "inactive").length || 0}
          </div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Suspended</div>
          <div className="text-2xl font-bold text-destructive mt-1">
            {users?.filter((u) => u.status === "suspended").length || 0}
          </div>
        </div>
      </div>
    </div>
  );
}
