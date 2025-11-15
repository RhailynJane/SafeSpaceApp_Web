"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

// Gender options matching mobile app
const GENDER_OPTIONS = [
  "Woman", "Man", "Non-Binary", "Agender", "Gender-fluid", "Genderqueer",
  "Gender Variant", "Intersex", "Non-Conforming", "Questioning",
  "Transgender Man", "Transgender Woman", "Two-Spirit",
  "I don't identify with any gender", "I do not know", "Prefer not to answer"
];

const CANADA_STATUS_OPTIONS = [
  "Canadian Citizen", "Permanent Resident", "Refugee", "Newcomer",
  "Temporary Resident", "Do not know", "Prefer not to answer", "Other"
];

const ETHNOCULTURAL_OPTIONS = [
  "First Nations", "Métis", "Inuit", "European", "Asian", "South Asian",
  "Southeast Asian", "African", "Caribbean", "Latin American",
  "Middle Eastern", "Mixed Heritage", "Prefer not to answer", "Other"
];

const LANGUAGE_OPTIONS = [
  "English", "French", "Spanish", "Mandarin", "Cantonese", "Punjabi",
  "Tagalog", "Arabic", "German", "Italian", "Portuguese", "Russian",
  "Japanese", "Korean", "Hindi", "Vietnamese", "Other"
];

const HEALTH_CONCERNS_OPTIONS = [
  "I have a disability",
  "I have an illness or mental-health concern",
  "I do not have any ongoing medical conditions",
  "I do not know",
  "Not applicable",
  "Prefer not to answer"
];

export default function CreateAccountPage() {
  const router = useRouter();
  const { user } = useUser();
  const [formData, setFormData] = useState({
    // Basic Info
    email: "",
    firstName: "",
    lastName: "",
    roleId: "",
    orgId: "",
    phoneNumber: "",
    // Extended Client Profile Fields
    dateOfBirth: "",
    gender: "",
    pronouns: "",
    isLGBTQ: "",
    primaryLanguage: "",
    ethnoculturalBackground: "",
    canadaStatus: "",
    dateCameToCanada: "",
    streetAddress: "",
    city: "",
    postalCode: "",
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactNumber: "",
    mentalHealthConcerns: "",
    supportNeeded: "",
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

  // Check if Client role is selected
  const isClientRole = formData.roleId === "client";

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
        {/* Basic Account Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Account Information</h3>
          
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
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>

        {/* Extended Client Profile Fields */}
        {isClientRole && (
          <>
            {/* Personal Information */}
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Pronouns</label>
                  <input
                    type="text"
                    value={formData.pronouns}
                    onChange={(e) => setFormData({ ...formData, pronouns: e.target.value })}
                    placeholder="e.g., she/her, he/him, they/them"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Demographics */}
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-semibold">Demographics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select gender</option>
                    {GENDER_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">LGBTQ+ Identity</label>
                  <select
                    value={formData.isLGBTQ}
                    onChange={(e) => setFormData({ ...formData, isLGBTQ: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select identity</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                    <option value="unknown">I do not know</option>
                    <option value="prefer_not_to_answer">Prefer not to answer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Primary Language</label>
                  <select
                    value={formData.primaryLanguage}
                    onChange={(e) => setFormData({ ...formData, primaryLanguage: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select language</option>
                    {LANGUAGE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Ethnocultural Background</label>
                  <select
                    value={formData.ethnoculturalBackground}
                    onChange={(e) => setFormData({ ...formData, ethnoculturalBackground: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select background</option>
                    {ETHNOCULTURAL_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Canada Status */}
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-semibold">Canada Status</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Canada Status</label>
                  <select
                    value={formData.canadaStatus}
                    onChange={(e) => setFormData({ ...formData, canadaStatus: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select status</option>
                    {CANADA_STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                {(formData.canadaStatus && !["Canadian Citizen", "Do not know", "Prefer not to answer"].includes(formData.canadaStatus)) && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Date Came to Canada</label>
                    <input
                      type="date"
                      value={formData.dateCameToCanada}
                      onChange={(e) => setFormData({ ...formData, dateCameToCanada: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-semibold">Address</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Street Address</label>
                  <input
                    type="text"
                    value={formData.streetAddress}
                    onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Postal Code</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="A1A 1A1"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-semibold">Emergency Contact</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Emergency Contact Name</label>
                  <input
                    type="text"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Relationship</label>
                  <input
                    type="text"
                    value={formData.emergencyContactRelationship}
                    onChange={(e) => setFormData({ ...formData, emergencyContactRelationship: e.target.value })}
                    placeholder="e.g., Parent, Spouse, Friend"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Emergency Contact Number</label>
                  <input
                    type="tel"
                    value={formData.emergencyContactNumber}
                    onChange={(e) => setFormData({ ...formData, emergencyContactNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Health Information */}
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-semibold">Health Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Mental Health Concerns</label>
                  <select
                    value={formData.mentalHealthConcerns}
                    onChange={(e) => setFormData({ ...formData, mentalHealthConcerns: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select option</option>
                    {HEALTH_CONCERNS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">What Support Are You Looking For?</label>
                  <textarea
                    value={formData.supportNeeded}
                    onChange={(e) => setFormData({ ...formData, supportNeeded: e.target.value })}
                    rows={4}
                    placeholder="Describe the type of support you need..."
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>
              </div>
            </div>
          </>
        )}

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
