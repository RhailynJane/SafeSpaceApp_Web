"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusModal, ConfirmModal } from "@/components/ui/modal";

export default function OrganizationEditPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug;
  const { user } = useUser();
  const clerkId = user?.id;
  const [form, setForm] = useState({
    name: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    website: "",
    logoUrl: "",
    status: "active",
  });
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  if (slug === "safespace") {
    if (typeof window !== "undefined") router.replace("/superadmin/organizations");
    return null;
  }

  const org = useQuery(api.organizations.getBySlug, clerkId && slug ? { clerkId, slug } : "skip");
  const updateOrg = useMutation(api.organizations.update);
  const removeOrg = useMutation(api.organizations.remove);

  useEffect(() => {
    if (org) {
      setForm({
        name: org.name || "",
        description: org.description || "",
        contactEmail: org.contactEmail || "",
        contactPhone: org.contactPhone || "",
        address: org.address || "",
        website: org.website || "",
        logoUrl: org.logoUrl || "",
        status: org.status || "active",
      });
    }
  }, [org]);

  const onChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    // Real-time phone formatting
    if (name === "contactPhone") {
      // Remove all non-digit characters
      const digits = value.replace(/\D/g, "");
      // Limit to 10 digits
      const limitedDigits = digits.slice(0, 10);
      
      // Format as (XXX) XXX-XXXX
      if (limitedDigits.length === 0) {
        newValue = "";
      } else if (limitedDigits.length <= 3) {
        newValue = `(${limitedDigits}`;
      } else if (limitedDigits.length <= 6) {
        newValue = `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3)}`;
      } else {
        newValue = `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`;
      }
    }

    setForm((f) => ({ ...f, [name]: newValue }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};

    // Name validation
    if (!form.name?.trim()) {
      errors.name = "Organization name is required";
    } else if (form.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    } else if (form.name.trim().length > 100) {
      errors.name = "Name must be less than 100 characters";
    }

    // Contact Email validation
    if (form.contactEmail?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.contactEmail.trim())) {
        errors.contactEmail = "Invalid email format";
      }
    }

    // Contact Phone validation
    if (form.contactPhone?.trim()) {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      const digitsOnly = form.contactPhone.replace(/\D/g, "");
      if (!phoneRegex.test(form.contactPhone.trim())) {
        errors.contactPhone = "Phone number can only contain digits, spaces, and +-()";
      } else if (digitsOnly.length !== 10) {
        errors.contactPhone = "Phone number must be exactly 10 digits";
      }
    }

    // Website validation
    if (form.website?.trim()) {
      try {
        new URL(form.website.trim());
      } catch {
        errors.website = "Invalid website URL (must include http:// or https://)";
      }
    }

    // Logo URL validation
    if (form.logoUrl?.trim()) {
      try {
        const url = new URL(form.logoUrl.trim());
        if (!url.protocol.startsWith('http')) {
          errors.logoUrl = "Logo URL must be a valid HTTP(S) URL";
        }
      } catch {
        errors.logoUrl = "Invalid logo URL";
      }
    }

    // Description validation
    if (form.description && form.description.length > 500) {
      errors.description = "Description must be less than 500 characters";
    }

    // Address validation
    if (form.address && form.address.length > 200) {
      errors.address = "Address must be less than 200 characters";
    }

    return errors;
  };

  const onSave = async () => {
    if (!clerkId || !org?._id) return;

    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMsg("Please fix validation errors before saving");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSaving(true);
    setErrorMsg("");
    setFieldErrors({});

    try {
      await updateOrg({
        clerkId,
        id: org._id,
        ...form,
      });
      setShowSuccess(true);
    } catch (e) {
      console.error("Failed to update org", e);
      setErrorMsg(e?.message || "Failed to save organization");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!clerkId || !org?._id) return;
    
    setConfirmOpen(false); // Close confirm dialog immediately
    
    try {
      await removeOrg({ clerkId, id: org._id });
      router.push("/superadmin/organizations");
    } catch (e) {
      console.error("Failed to delete organization:", e);
      const errorMessage = e?.message || "Failed to delete organization";
      setErrorMsg(errorMessage);
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Edit Organization</h2>
          <p className="text-muted-foreground">Update organization details and branding.</p>
        </div>
        <Link href={`/superadmin/organizations/${slug}`} className="text-indigo-600 hover:underline">
          Cancel
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {errorMsg}
            </div>
          )}
          <div>
            <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
            <Input 
              id="name" 
              name="name" 
              value={form.name} 
              onChange={onChange}
              className={fieldErrors.name ? "border-red-500" : ""}
            />
            {fieldErrors.name && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.name}</p>
            )}
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input 
              id="description" 
              name="description" 
              value={form.description} 
              onChange={onChange}
              className={fieldErrors.description ? "border-red-500" : ""}
            />
            {fieldErrors.description && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.description}</p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input 
                id="contactEmail" 
                name="contactEmail" 
                value={form.contactEmail} 
                onChange={onChange}
                type="email"
                className={fieldErrors.contactEmail ? "border-red-500" : ""}
              />
              {fieldErrors.contactEmail && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.contactEmail}</p>
              )}
            </div>
            <div>
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input 
                id="contactPhone" 
                name="contactPhone" 
                value={form.contactPhone} 
                onChange={onChange}
                type="tel"
                className={fieldErrors.contactPhone ? "border-red-500" : ""}
              />
              {fieldErrors.contactPhone && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.contactPhone}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="address">Address</Label>
              <Input 
                id="address" 
                name="address" 
                value={form.address} 
                onChange={onChange}
                className={fieldErrors.address ? "border-red-500" : ""}
              />
              {fieldErrors.address && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.address}</p>
              )}
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input 
                id="website" 
                name="website" 
                value={form.website} 
                onChange={onChange}
                placeholder="https://example.com"
                className={fieldErrors.website ? "border-red-500" : ""}
              />
              {fieldErrors.website && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.website}</p>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input 
              id="logoUrl" 
              name="logoUrl" 
              value={form.logoUrl} 
              onChange={onChange}
              placeholder="https://example.com/logo.png"
              className={fieldErrors.logoUrl ? "border-red-500" : ""}
            />
            {fieldErrors.logoUrl && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.logoUrl}</p>
            )}
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={form.status} onValueChange={(v)=>setForm((f)=>({...f,status:v}))}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">active</SelectItem>
                <SelectItem value="inactive">inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" asChild>
              <Link href={`/superadmin/organizations/${slug}`}>Cancel</Link>
            </Button>
            <Button onClick={onSave} disabled={saving} className="flex items-center gap-2">
              {saving && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            {slug !== "safespace" && (
              <Button variant="destructive" onClick={()=>setConfirmOpen(true)}>Delete</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <StatusModal open={showSuccess} onOpenChange={setShowSuccess} status="success" title="Saved" message="Organization updated successfully." />
      <StatusModal open={!!errorMsg} onOpenChange={()=>setErrorMsg("")} status="error" title="Error" message={errorMsg} />
      <ConfirmModal open={confirmOpen} onOpenChange={setConfirmOpen} variant="warning" title="Delete Organization" description="This action cannot be undone." onConfirm={onDelete} />
    </div>
  );
}
