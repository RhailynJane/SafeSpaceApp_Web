"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function AccountDetailPage() {
  const params = useParams();
  const { user } = useUser();
  const accountId = params?.clerkId ? String(params.clerkId) : undefined;

  // Clerk IDs start with "user_", everything else could be either users or clients table
  const isClerkId = accountId && accountId.startsWith("user_");

  // Try fetching from users table (using clerkId or as getByClerkId)
  const userAccount = useQuery(
    api.users.getByClerkId,
    user?.id && accountId && isClerkId
      ? { clerkId: user.id, targetClerkId: accountId }
      : "skip"
  );

  // For non-Clerk IDs, try users table by document ID first (for users with role=client)
  const userById = useQuery(
    api.users.getById,
    user?.id && accountId && !isClerkId
      ? { clerkId: user.id, userId: accountId }
      : "skip"
  );

  // Try fetching from clients table (for actual client records)
  const clientAccount = useQuery(
    api.clients.getById,
    user?.id && accountId && !isClerkId && !userById
      ? { clerkId: user.id, clientId: accountId }
      : "skip"
  );

  // Use whichever query returned data
  const account = userAccount || userById || clientAccount;
  const isClient = (!!clientAccount || (userById && userById.roleId === "client")) && !userAccount;

  if (!accountId) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{isClient ? "Client Account" : "User Account"}</h2>
          <p className="text-gray-600">View account details</p>
        </div>
        <Link href={`/superadmin/accounts/${accountId}/edit`} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
          Edit
        </Link>
      </div>

      {!account && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
          Loading account...
        </div>
      )}

      {account && (
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <div className="text-lg font-semibold text-gray-900">
            {account.firstName} {account.lastName}
          </div>
          <div className="text-gray-700">{account.email}</div>
          <div>
            <span className="text-sm text-gray-600">Role:</span>
            <span className="ml-2 text-sm font-medium bg-purple-100 text-purple-800 px-2 py-1 rounded">
              {account.roleId}
            </span>
          </div>
          <div>
            <span className="text-sm text-gray-600">Organization:</span>
            <span className="ml-2 text-sm">{account.orgId || "N/A"}</span>
          </div>
        </div>
      )}

      <div>
        <Link href="/superadmin/accounts" className="text-indigo-600 hover:underline">
          ← Back to Accounts
        </Link>
      </div>
    </div>
  );
}
