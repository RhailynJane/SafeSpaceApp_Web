"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusModal, ConfirmModal } from "@/components/ui/modal";

export default function AccountEditPage() {
  const params = useParams();
  const router = useRouter();
  const clerkId = params?.clerkId ? String(params.clerkId) : undefined;
  const { user } = useUser();
  const me = user?.id;
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    roleId: "",
    orgId: "",
    status: "active",
    profileImageUrl: "",
    phoneNumber: "",
    address: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!clerkId) return null;

  const target = useQuery(api.users.getByClerkId, me && clerkId ? { clerkId: me, targetClerkId: clerkId } : "skip");
  const updateUser = useMutation(api.users.update);
  const deleteUser = useMutation(api.users.remove);
  const roles = useQuery(api.roles.list, me ? { clerkId: me } : "skip");
  const orgs = useQuery(api.organizations.list, me ? { clerkId: me } : "skip");

  useEffect(() => {
    if (target) {
      setForm({
        firstName: target.firstName || "",
        lastName: target.lastName || "",
        email: target.email || "",
        roleId: target.roleId || "",
        orgId: target.orgId || "",
        status: target.status || "active",
        profileImageUrl: target.profileImageUrl || target.imageUrl || "",
        phoneNumber: target.phoneNumber || "",
        address: target.address || "",
        emergencyContactName: target.emergencyContactName || "",
        emergencyContactPhone: target.emergencyContactPhone || "",
      });
    }
  }, [target]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSave = async () => {
    if (!me || !clerkId) return;
    setSaving(true);
    try {
      await updateUser({ clerkId: me, targetClerkId: clerkId, ...form });
      setShowSuccess(true);
    } catch (e) {
      console.error("Failed to update user", e);
      setErrorMsg(e?.message || "Failed to save account");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!me || !clerkId) return;
    try {
      await deleteUser({ clerkId: me, targetClerkId: clerkId });
      router.push("/superadmin/accounts");
    } catch (e) {
      setErrorMsg(e?.message || "Failed to delete account");
    } finally {
      setConfirmOpen(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Edit Account</h2>
          <p className="text-muted-foreground">Update account details and permissions.</p>
        </div>
        <Link href={`/superadmin/accounts/${clerkId}`} className="text-indigo-600 hover:underline">
          Cancel
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" name="firstName" value={form.firstName} onChange={onChange} />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" name="lastName" value={form.lastName} onChange={onChange} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" value={form.email} onChange={onChange} />
            </div>
            <div>
              <Label htmlFor="roleId">Role</Label>
              <Select value={form.roleId} onValueChange={(v)=>setForm((f)=>({...f, roleId: v}))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {(roles||[]).map((r)=> (
                    <SelectItem key={r.slug} value={r.slug}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="orgId">Organization</Label>
              <Select value={form.orgId} onValueChange={(v)=>setForm((f)=>({...f, orgId:v}))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select organization" /></SelectTrigger>
                <SelectContent>
                  {(orgs||[]).map((o)=> (
                    <SelectItem key={o.slug} value={o.slug}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Input id="status" name="status" value={form.status} onChange={onChange} placeholder="active | inactive | suspended" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="profileImageUrl">Profile Image URL</Label>
              <Input id="profileImageUrl" name="profileImageUrl" value={form.profileImageUrl} onChange={onChange} />
            </div>
            <div>
              <Label htmlFor="phoneNumber">Phone</Label>
              <Input id="phoneNumber" name="phoneNumber" value={form.phoneNumber} onChange={onChange} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" value={form.address} onChange={onChange} />
            </div>
            <div>
              <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
              <Input id="emergencyContactName" name="emergencyContactName" value={form.emergencyContactName} onChange={onChange} />
            </div>
          </div>
          <div>
            <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
            <Input id="emergencyContactPhone" name="emergencyContactPhone" value={form.emergencyContactPhone} onChange={onChange} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" asChild>
              <Link href={`/superadmin/accounts/${clerkId}`}>Cancel</Link>
            </Button>
            <Button onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
            <Button variant="destructive" onClick={()=>setConfirmOpen(true)}>Delete</Button>
          </div>
        </CardContent>
      </Card>

      <StatusModal open={showSuccess} onOpenChange={setShowSuccess} status="success" title="Saved" message="Account updated successfully." />
      <StatusModal open={!!errorMsg} onOpenChange={()=>setErrorMsg("")} status="error" title="Error" message={errorMsg} />
      <ConfirmModal open={confirmOpen} onOpenChange={setConfirmOpen} variant="warning" title="Delete Account" description="This action cannot be undone." onConfirm={onDelete} />
    </div>
  );
}
