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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Organization</h2>
          <p className="text-gray-600">Manage organization details and settings</p>
        </div>
        <Link
          href={`/superadmin/organizations/${slug}/edit`}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Edit Organization
        </Link>
      </div>

      {!org && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
          Loading organization...
        </div>
      )}

      {org && (
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <div>
            <div className="text-sm text-gray-600">Name</div>
            <div className="text-lg font-semibold text-gray-900">{org.name}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Slug</div>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">{org.slug}</code>
          </div>
          {org.description && (
            <div>
              <div className="text-sm text-gray-600">Description</div>
              <div className="text-gray-800">{org.description}</div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Status</div>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                org.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
              }`}>
                {org.status}
              </span>
            </div>
            {org.contactEmail && (
              <div>
                <div className="text-sm text-gray-600">Contact Email</div>
                <div>{org.contactEmail}</div>
              </div>
            )}
            {org.contactPhone && (
              <div>
                <div className="text-sm text-gray-600">Contact Phone</div>
                <div>{org.contactPhone}</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <Link href="/superadmin/organizations" className="text-indigo-600 hover:underline">
          ← Back to Organizations
        </Link>
      </div>
    </div>
  );
}
