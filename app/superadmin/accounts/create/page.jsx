"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function CreateAccountPage() {
  const router = useRouter();
  const { user } = useUser();
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    roleId: "",
    orgId: "",
    phoneNumber: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const organizations = useQuery(
    api.organizations.list,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const roles = useQuery(api.roles.list);

  // Filter out safespace organization
  const visibleOrganizations = organizations?.filter(org => org.slug !== "safespace") || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // In a real implementation, you would:
      // 1. Create user in Clerk first
      // 2. Get the Clerk user ID
      // 3. Then create in Convex with that ID
      
      alert("Account creation requires Clerk integration. This is a placeholder.");
      // router.push("/superadmin/accounts");
    } catch (err) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Create User Account</h2>
          <p className="text-muted-foreground">Add a new user to the system</p>
        </div>
        <Link
          href="/superadmin/accounts"
          className="px-4 py-2 bg-card border rounded-lg hover:bg-accent transition-colors"
        >
          Cancel
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-card rounded-lg border p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              First Name *
            </label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Last Name *
            </label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Email Address *
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Role *
            </label>
            <select
              required
              value={formData.roleId}
              onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Select a role</option>
              {roles?.map((role) => (
                <option key={role._id} value={role.slug}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Organization *
            </label>
            <select
              required
              value={formData.orgId}
              onChange={(e) => setFormData({ ...formData, orgId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Select an organization</option>
              {visibleOrganizations.map((org) => (
                <option key={org._id} value={org.slug}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div className="flex items-center justify-end space-x-4 pt-4 border-t">
          <Link
            href="/superadmin/accounts"
            className="px-6 py-2 bg-card border rounded-lg hover:bg-accent transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </div>
      </form>

      <div className="bg-muted border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> Account creation requires Clerk webhook integration to sync users between Clerk and Convex.
          This is a placeholder page for the UI flow.
        </p>
      </div>
    </div>
  );
}
