"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/contexts/ToastContext.jsx";

export default function AccountsPage() {
  const { user } = useUser();
  const [selectedOrg, setSelectedOrg] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [statusOverride, setStatusOverride] = useState({});
  const { success, error } = useToast();

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

  // Debug: Log users to console
  console.log("SuperAdmin Users List:", users);

  async function handleToggleSuspend(targetClerkId, currentStatus) {
    const action = currentStatus === "suspended" ? "unsuspend" : "suspend";
    try {
      const res = await fetch("/api/admin/suspend-clerk-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetClerkId, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to update account status");
      }
      setStatusOverride((prev) => ({
        ...prev,
        [targetClerkId]: action === "suspend" ? "suspended" : "active",
      }));
      success(
        action === "suspend" ? "User suspended and sessions revoked" : "User unsuspended"
      );
    } catch (e) {
      error(e?.message || "Unable to update user status");
    }
  }

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
                const effectiveStatus = statusOverride[u.clerkId] ?? u.status;
                const isClient = u.roleId === "client";
                // Determine if this is from clients table (no clerkId) vs users table with role=client
                const isFromClientsTable = isClient && !u.clerkId;

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
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        isClient ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                      }`}>
                        {isClient ? "Client" : (role?.name || u.roleId)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {org?.name || u.orgId || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          effectiveStatus === "active"
                            ? "bg-green-100 text-green-800"
                            : effectiveStatus === "inactive"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {effectiveStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {u.lastLogin
                        ? new Date(u.lastLogin).toLocaleDateString()
                        : "Never"}
                      {/* Debug: {u.lastLogin ? `(${u.lastLogin})` : '(undefined)'} */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            aria-label="Actions"
                            className="inline-flex items-center justify-center rounded-md p-2 hover:bg-muted text-foreground"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/superadmin/accounts/${isFromClientsTable ? u._id : u.clerkId}`}>View</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/superadmin/accounts/${isFromClientsTable ? u._id : u.clerkId}/edit`}>Edit</Link>
                          </DropdownMenuItem>
                          {!isFromClientsTable && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleToggleSuspend(u.clerkId, effectiveStatus)}
                              >
                                {effectiveStatus === "suspended" ? "Unsuspend" : "Suspend"}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
