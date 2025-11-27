"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function OrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const slug = params?.slug;

  const org = useQuery(
    api.organizations.getBySlug,
    user?.id && slug ? { clerkId: user.id, slug: String(slug) } : "skip"
  );

  if (slug === "safespace") {
    // Prevent direct access
    if (typeof window !== "undefined") router.replace("/superadmin/organizations");
    return null;
  }

  const role = String((user?.publicMetadata?.role || user?.publicMetadata?.roleId || "")).toLowerCase();
  const isSuperAdmin = role === "superadmin" || role === "super_admin";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Organization</h2>
          <p className="text-muted-foreground">Manage organization details and settings</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/superadmin/organizations/${slug}/edit`}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Edit Organization
          </Link>
          {isSuperAdmin && (
            <Link
              href={`/superadmin/organizations/${slug}/access-control`}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Access Control
            </Link>
          )}
        </div>
      </div>

      {!org && (
        <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-600 dark:text-yellow-400 p-4 rounded-lg">
          Loading organization...
        </div>
      )}

      {org && (
        <div className="bg-card rounded-lg border border-border p-6 space-y-4">
          <div>
            <div className="text-sm text-muted-foreground">Name</div>
            <div className="text-lg font-semibold text-foreground">{org.name}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Slug</div>
            <code className="text-sm bg-muted px-2 py-1 rounded text-foreground">{org.slug}</code>
          </div>
          {org.description && (
            <div>
              <div className="text-sm text-muted-foreground">Description</div>
              <div className="text-foreground">{org.description}</div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                org.status === "active" ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-muted text-muted-foreground"
              }`}>
                {org.status}
              </span>
            </div>
            {org.contactEmail && (
              <div>
                <div className="text-sm text-muted-foreground">Contact Email</div>
                <div className="text-foreground">{org.contactEmail}</div>
              </div>
            )}
            {org.contactPhone && (
              <div>
                <div className="text-sm text-muted-foreground">Contact Phone</div>
                <div className="text-foreground">{org.contactPhone}</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <Link href="/superadmin/organizations" className="text-indigo-600 dark:text-indigo-400 hover:underline transition-colors">
          ← Back to Organizations
        </Link>
      </div>
    </div>
  );
}
