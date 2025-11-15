"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { useState } from "react";

export default function OrganizationsPage() {
  const { user } = useUser();
  const [filter, setFilter] = useState("all");
  
  const organizations = useQuery(
    api.organizations.list,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Filter out safespace organization (hidden system org)
  const visibleOrganizations = organizations?.filter(org => org.slug !== "safespace") || [];

  const filteredOrgs = visibleOrganizations.filter((org) => {
    if (filter === "all") return true;
    return org.status === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Organizations</h2>
          <p className="text-muted-foreground">Manage all organizations in the system</p>
        </div>
        <Link
          href="/superadmin/organizations/create"
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
        >
          + Create Organization
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border p-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium">Filter:</span>
          <div className="flex space-x-2">
            {["all", "active", "inactive", "suspended"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  filter === status
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                    : "bg-accent text-accent-foreground/80 hover:opacity-90"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          <span className="text-sm text-muted-foreground ml-auto">
            {filteredOrgs?.length || 0} organization(s)
          </span>
        </div>
      </div>

      {/* Organizations List */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/30">
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
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrgs?.map((org) => (
                <tr key={org._id} className="hover:bg-muted/30">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">{org.name}</div>
                      {org.description && (
                        <div className="text-sm text-muted-foreground mt-1">{org.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {org.slug}
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        org.status === "active"
                          ? "bg-green-100 text-green-800"
                          : org.status === "inactive"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {org.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {org.contactEmail && (
                      <div>{org.contactEmail}</div>
                    )}
                    {org.contactPhone && (
                      <div className="text-xs">{org.contactPhone}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Link
                      href={`/superadmin/organizations/${org.slug}`}
                      className="text-emerald-700 hover:underline dark:text-emerald-300"
                    >
                      View
                    </Link>
                    <Link
                      href={`/superadmin/organizations/${org.slug}/edit`}
                      className="text-emerald-700 hover:underline dark:text-emerald-300"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredOrgs?.length === 0 && (
            <div className="text-center py-12">
              <span className="text-4xl mb-4 block">🏢</span>
              <p className="text-muted-foreground">No organizations found</p>
              <Link
                href="/superadmin/organizations/create"
                className="text-emerald-700 hover:underline text-sm mt-2 inline-block dark:text-emerald-300"
              >
                Create your first organization
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
