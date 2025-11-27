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
  const [successInfo, setSuccessInfo] = useState(null); // { email, temporaryPassword }
  const [fieldErrors, setFieldErrors] = useState({});
  const [copied, setCopied] = useState(false);

  // Validation helpers
  const validateEmail = (email) => {
    if (!email) return "Email is required";
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) return "Invalid email format";
    if (email.length > 255) return "Email too long (max 255 characters)";
    return "";
  };

  const validatePhone = (phone) => {
    if (!phone) return "";
    const regex = /^[\d\s()+-]+$/;
    if (!regex.test(phone)) return "Invalid phone number (digits, spaces, +, -, ( ) only)";
    if (phone.length > 20) return "Phone number too long (max 20 characters)";
    return "";
  };

  const validatePostalCode = (code) => {
    if (!code) return "";
    // Canadian postal code: A1A 1A1
    const regex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
    if (!regex.test(code)) return "Invalid postal code format (e.g., A1A 1A1)";
    return "";
  };

  const validateRequired = (value, fieldName) => {
    if (!value || value.trim() === "") return `${fieldName} is required`;
    return "";
  };

  const validateName = (name, fieldName) => {
    if (!name || name.trim() === "") return `${fieldName} is required`;
    if (name.length > 100) return `${fieldName} too long (max 100 characters)`;
    return "";
  };

  const validateDate = (date, fieldName) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return `Invalid ${fieldName}`;
    if (fieldName === "Date of Birth" && d > new Date()) return "Date of birth cannot be in the future";
    return "";
  };

  const handleFieldChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Clear error for this field on change
    setFieldErrors({ ...fieldErrors, [field]: "" });
  };

  const handleFieldBlur = (field) => {
    let error = "";
    const value = formData[field];

    switch (field) {
      case "email":
        error = validateEmail(value);
        break;
      case "firstName":
        error = validateName(value, "First name");
        break;
      case "lastName":
        error = validateName(value, "Last name");
        break;
      case "roleId":
        error = validateRequired(value, "Role");
        break;
      case "orgId":
        error = validateRequired(value, "Organization");
        break;
      case "phoneNumber":
      case "emergencyContactNumber":
        error = validatePhone(value);
        break;
      case "postalCode":
        error = validatePostalCode(value);
        break;
      case "dateOfBirth":
        error = validateDate(value, "Date of Birth");
        break;
      case "dateCameToCanada":
        error = validateDate(value, "Date Came to Canada");
        break;
      default:
        break;
    }

    if (error) {
      setFieldErrors({ ...fieldErrors, [field]: error });
    }
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(successInfo.temporaryPassword || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy password:", err);
    }
  };

  // Check if SuperAdmin role is selected
  const isSuperAdminRole = formData.roleId === "superadmin";

  const organizations = useQuery(
    api.organizations.list,
    user?.id ? { clerkId: user.id, includeSafespace: isSuperAdminRole } : "skip"
  );
  const roles = useQuery(api.roles.list);

  // Check if Client role is selected
  const isClientRole = formData.roleId === "client";

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all required fields
    const errors = {};
    errors.email = validateEmail(formData.email);
    errors.firstName = validateName(formData.firstName, "First name");
    errors.lastName = validateName(formData.lastName, "Last name");
    errors.roleId = validateRequired(formData.roleId, "Role");
    errors.orgId = validateRequired(formData.orgId, "Organization");
    if (formData.phoneNumber) errors.phoneNumber = validatePhone(formData.phoneNumber);
    if (formData.emergencyContactNumber) errors.emergencyContactNumber = validatePhone(formData.emergencyContactNumber);
    if (formData.postalCode) errors.postalCode = validatePostalCode(formData.postalCode);
    if (formData.dateOfBirth) errors.dateOfBirth = validateDate(formData.dateOfBirth, "Date of Birth");
    if (formData.dateCameToCanada) errors.dateCameToCanada = validateDate(formData.dateCameToCanada, "Date Came to Canada");

    // Filter out empty errors
    const nonEmptyErrors = Object.fromEntries(
      Object.entries(errors).filter(([_, v]) => v !== "")
    );

    if (Object.keys(nonEmptyErrors).length > 0) {
      setFieldErrors(nonEmptyErrors);
      setError("Please fix validation errors before submitting");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      // Success! Show the temporary password once and email notice
      setSuccessInfo({ email: formData.email, temporaryPassword: data.temporaryPassword });
    } catch (err) {
      setError(err.message || "Failed to create account");
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: "smooth" });
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
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          <p className="font-medium">Error Creating Account</p>
          <p className="text-sm mt-1">{error}</p>
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
                onChange={(e) => handleFieldChange("firstName", e.target.value)}
                onBlur={() => handleFieldBlur("firstName")}
                className={`w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:ring-2 focus:ring-emerald-500 ${
                  fieldErrors.firstName ? "border-red-500" : "border-input"
                }`}
              />
              {fieldErrors.firstName && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.firstName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => handleFieldChange("lastName", e.target.value)}
                onBlur={() => handleFieldBlur("lastName")}
                className={`w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:ring-2 focus:ring-emerald-500 ${
                  fieldErrors.lastName ? "border-red-500" : "border-input"
                }`}
              />
              {fieldErrors.lastName && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.lastName}</p>
              )}
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
              onChange={(e) => handleFieldChange("email", e.target.value)}
              onBlur={() => handleFieldBlur("email")}
              className={`w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:ring-2 focus:ring-emerald-500 ${
                fieldErrors.email ? "border-red-500" : "border-input"
              }`}
            />
            {fieldErrors.email && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Role *
              </label>
              <select
                required
                value={formData.roleId}
                onChange={(e) => handleFieldChange("roleId", e.target.value)}
                onBlur={() => handleFieldBlur("roleId")}
                className={`w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:ring-2 focus:ring-emerald-500 ${
                  fieldErrors.roleId ? "border-red-500" : "border-input"
                }`}
              >
                <option value="">Select a role</option>
                {roles?.map((role) => (
                  <option key={role._id} value={role.slug}>
                    {role.name}
                  </option>
                ))}
              </select>
              {fieldErrors.roleId && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.roleId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Organization *
              </label>
              <select
                required
                value={formData.orgId}
                onChange={(e) => handleFieldChange("orgId", e.target.value)}
                onBlur={() => handleFieldBlur("orgId")}
                className={`w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:ring-2 focus:ring-emerald-500 ${
                  fieldErrors.orgId ? "border-red-500" : "border-input"
                }`}
              >
                <option value="">Select an organization</option>
                {organizations?.map((org) => (
                  <option key={org._id} value={org.slug}>
                    {org.name}
                  </option>
                ))}
              </select>
              {fieldErrors.orgId && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.orgId}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleFieldChange("phoneNumber", e.target.value)}
              onBlur={() => handleFieldBlur("phoneNumber")}
              className={`w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:ring-2 focus:ring-emerald-500 ${
                fieldErrors.phoneNumber ? "border-red-500" : "border-input"
              }`}
              placeholder="+1 (555) 123-4567"
            />
            {fieldErrors.phoneNumber && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.phoneNumber}</p>
            )}
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
                    onChange={(e) => handleFieldChange("dateOfBirth", e.target.value)}
                    onBlur={() => handleFieldBlur("dateOfBirth")}
                    className={`w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:ring-2 focus:ring-emerald-500 ${
                      fieldErrors.dateOfBirth ? "border-red-500" : "border-input"
                    }`}
                  />
                  {fieldErrors.dateOfBirth && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.dateOfBirth}</p>
                  )}
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
                      onChange={(e) => handleFieldChange("dateCameToCanada", e.target.value)}
                      onBlur={() => handleFieldBlur("dateCameToCanada")}
                      className={`w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:ring-2 focus:ring-emerald-500 ${
                        fieldErrors.dateCameToCanada ? "border-red-500" : "border-input"
                      }`}
                    />
                    {fieldErrors.dateCameToCanada && (
                      <p className="text-red-500 text-sm mt-1">{fieldErrors.dateCameToCanada}</p>
                    )}
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
                    onChange={(e) => handleFieldChange("postalCode", e.target.value)}
                    onBlur={() => handleFieldBlur("postalCode")}
                    placeholder="A1A 1A1"
                    className={`w-full px-3 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-emerald-500 ${
                      fieldErrors.postalCode ? "border-red-500" : "border-input"
                    }`}
                  />
                  {fieldErrors.postalCode && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.postalCode}</p>
                  )}
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
                    onChange={(e) => handleFieldChange("emergencyContactNumber", e.target.value)}
                    onBlur={() => handleFieldBlur("emergencyContactNumber")}
                    className={`w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:ring-2 focus:ring-emerald-500 ${
                      fieldErrors.emergencyContactNumber ? "border-red-500" : "border-input"
                    }`}
                  />
                  {fieldErrors.emergencyContactNumber && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.emergencyContactNumber}</p>
                  )}
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
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </div>
      </form>

      {/* Success modal showing the temporary password once */}
      {successInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-card border rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold">Account Created</h3>
            <p className="text-sm text-muted-foreground">
              A verification email has been sent to <span className="font-medium text-foreground">{successInfo.email}</span>.
              Share the temporary password below with the user so they can sign in and will be asked to change it after verification.
            </p>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Temporary Password (shown once)</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={successInfo.temporaryPassword || ""}
                  className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground"
                />
                <button
                  type="button"
                  onClick={copyPassword}
                  className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                For security, this password is not stored and won’t be shown again.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSuccessInfo(null);
                  router.push("/superadmin/accounts?created=true");
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
