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

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSave = async () => {
    if (!clerkId || !org?._id) return;
    setSaving(true);
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
    try {
      await removeOrg({ clerkId, id: org._id });
      router.push("/superadmin/organizations");
    } catch (e) {
      setErrorMsg(e?.message || "Failed to delete organization");
    } finally {
      setConfirmOpen(false);
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
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" value={form.name} onChange={onChange} />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" value={form.description} onChange={onChange} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input id="contactEmail" name="contactEmail" value={form.contactEmail} onChange={onChange} />
            </div>
            <div>
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input id="contactPhone" name="contactPhone" value={form.contactPhone} onChange={onChange} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" value={form.address} onChange={onChange} />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input id="website" name="website" value={form.website} onChange={onChange} />
            </div>
          </div>
          <div>
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input id="logoUrl" name="logoUrl" value={form.logoUrl} onChange={onChange} />
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
            <Button onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
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
