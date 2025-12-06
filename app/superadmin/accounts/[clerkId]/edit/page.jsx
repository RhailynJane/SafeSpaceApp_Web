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
  const accountId = params?.clerkId ? String(params.clerkId) : undefined;
  const { user } = useUser();
  const me = user?.id;
  
  // Clerk IDs start with "user_", everything else could be either users or clients table
  const isClerkId = accountId && accountId.startsWith("user_");
  
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    roleId: "",
    orgId: "",
    status: "active",
    profileImageUrl: "",
    phoneNumber: "",
    phone: "",
    address: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Validation helpers
  const validatePhone = (phone) => {
    if (!phone) return "";
    const trimmed = phone.trim();
    if (!trimmed) return "";
    const regex = /^[\d\s()+-]+$/;
    if (!regex.test(trimmed)) return "Invalid phone number (digits, spaces, +, -, ( ) only)";
    if (trimmed.length > 20) return "Phone number too long (max 20 characters)";
    return "";
  };

  const validateEmail = (email) => {
    if (!email) return "Email is required";
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) return "Invalid email format";
    if (email.length > 255) return "Email too long (max 255 characters)";
    return "";
  };

  const validateName = (name, fieldName) => {
    if (!name || name.trim() === "") return `${fieldName} is required`;
    if (name.length > 100) return `${fieldName} too long (max 100 characters)`;
    return "";
  };

  const validateRequired = (value, fieldName) => {
    if (!value || value.trim() === "") return `${fieldName} is required`;
    return "";
  };

  if (!accountId) return null;

  // Try fetching from users table
  const userTarget = useQuery(
    api.users.getByClerkId,
    me && accountId && isClerkId
      ? { clerkId: me, targetClerkId: accountId }
      : "skip"
  );

  // For non-Clerk IDs, try users table by document ID first (for users with role=client)
  const userById = useQuery(
    api.users.getById,
    me && accountId && !isClerkId
      ? { clerkId: me, userId: accountId }
      : "skip"
  );

  // Try fetching from clients table (for actual client records)
  const clientTarget = useQuery(
    api.clients.getById,
    me && accountId && !isClerkId && !userById
      ? { clerkId: me, clientId: accountId }
      : "skip"
  );

  // Use whichever query returned data
  const target = userTarget || userById || clientTarget;
  const isClient = (!!clientTarget || (userById && userById.roleId === "client")) && !userTarget;
  const isFromClientsTable = !!clientTarget && !userById && !userTarget;

  const updateUser = useMutation(api.users.update);
  const updateClient = useMutation(api.clients.update);
  const deleteUser = useMutation(api.users.remove);
  const deleteClient = useMutation(api.clients.remove);
  const roles = useQuery(api.roles.list);
  const orgs = useQuery(api.organizations.list, me ? { clerkId: me } : "skip");

  useEffect(() => {
    if (target) {
      setForm({
        firstName: target.firstName || "",
        lastName: target.lastName || "",
        email: target.email || "",
        roleId: isClient ? "client" : (target.roleId || ""),
        orgId: target.orgId || "",
        status: target.status || "active",
        profileImageUrl: target.profileImageUrl || target.imageUrl || "",
        phoneNumber: target.phoneNumber || target.phone || "",
        phone: target.phone || target.phoneNumber || "",
        address: target.address || "",
        emergencyContactName: target.emergencyContactName || "",
        emergencyContactPhone: target.emergencyContactPhone || "",
      });
    }
  }, [target, isClient]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    // Clear error for this field
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFieldBlur = (field) => {
    let error = "";
    const value = form[field];

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
      case "emergencyContactPhone":
        error = validatePhone(value);
        break;
      default:
        break;
    }

    if (error) {
      setFieldErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const onSave = async () => {
    if (!me || !accountId) return;

    // Validate all fields before saving
    const errors = {};
    errors.firstName = validateName(form.firstName, "First name");
    errors.lastName = validateName(form.lastName, "Last name");
    errors.email = validateEmail(form.email);
    if (!isClient) {
      errors.roleId = validateRequired(form.roleId, "Role");
    }
    errors.orgId = validateRequired(form.orgId, "Organization");
    if (form.phoneNumber || form.phone) {
      errors.phoneNumber = validatePhone(form.phoneNumber || form.phone);
    }
    if (form.emergencyContactPhone) errors.emergencyContactPhone = validatePhone(form.emergencyContactPhone);

    const nonEmptyErrors = Object.fromEntries(
      Object.entries(errors).filter(([_, v]) => v !== "")
    );

    if (Object.keys(nonEmptyErrors).length > 0) {
      setFieldErrors(nonEmptyErrors);
      setErrorMsg("Please fix validation errors before saving");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSaving(true);
    setErrorMsg("");

    try {
      if (isFromClientsTable) {
        // Update client from clients table
        const sanitizedForm = {
          firstName: form.firstName?.trim(),
          lastName: form.lastName?.trim(),
          email: form.email?.trim(),
          phone: (form.phone || form.phoneNumber)?.trim() || undefined,
          emergencyContactPhone: form.emergencyContactPhone?.trim() || undefined,
          address: form.address?.trim(),
          emergencyContactName: form.emergencyContactName?.trim(),
          status: form.status,
          orgId: form.orgId,
        };
        await updateClient({ clerkId: me, clientId: accountId, ...sanitizedForm });
      } else {
        // Update user (either by clerkId or userId)
        const sanitizedForm = {
          firstName: form.firstName?.trim(),
          lastName: form.lastName?.trim(),
          email: form.email?.trim(),
          phoneNumber: (form.phoneNumber || form.phone)?.trim() || undefined,
          emergencyContactPhone: form.emergencyContactPhone?.trim() || undefined,
          address: form.address?.trim(),
          emergencyContactName: form.emergencyContactName?.trim(),
          profileImageUrl: form.profileImageUrl?.trim(),
          roleId: form.roleId,
          status: form.status,
          orgId: form.orgId,
        };
        await updateUser({ clerkId: me, targetClerkId: accountId, ...sanitizedForm });
      }
      setShowSuccess(true);
    } catch (e) {
      const errMsg = e?.message || "Failed to save account";
      setErrorMsg(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!me || !accountId) return;
    try {
      if (isFromClientsTable) {
        // Delete client directly from clients table
        await deleteClient({ clerkId: me, clientId: accountId });
        router.push("/superadmin/accounts");
      } else {
        // Delete user (requires Clerk deletion if has clerkId)
        if (isClerkId) {
          // 1) Remove from Clerk so the user cannot log in anymore
          const resp = await fetch("/api/admin/delete-clerk-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetClerkId: accountId }),
          });
          if (!resp.ok) {
            const data = await resp.json().catch(() => ({}));
            throw new Error(data?.error || "Failed to delete from Clerk");
          }

          // 2) Remove from Convex database
          await deleteUser({ clerkId: me, targetClerkId: accountId });
        } else {
          // User without Clerk account (just delete from Convex)
          await deleteUser({ clerkId: me, targetClerkId: accountId });
        }
        router.push("/superadmin/accounts");
      }
    } catch (e) {
      setErrorMsg(e?.message || "Failed to delete account");
    } finally {
      setConfirmOpen(false);
    }
  };

  const onToggleSuspend = async () => {
    if (!me || !accountId) return;
    if (isFromClientsTable || !isClerkId) {
      // For clients or users without Clerk accounts, just update status directly
      setErrorMsg("This account doesn't have a login to suspend. Update status instead.");
      return;
    }
    const nextAction = (form.status || "active") === "suspended" ? "unsuspend" : "suspend";
    try {
      const resp = await fetch("/api/admin/suspend-clerk-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetClerkId: accountId, action: nextAction }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data?.error || `Failed to ${nextAction} user`);
      }
      // reflect status locally without waiting for requery
      setForm((f) => ({ ...f, status: nextAction === "suspend" ? "suspended" : "active" }));
      setShowSuccess(true);
    } catch (e) {
      setErrorMsg(e?.message || `Failed to ${nextAction} user`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Edit Account</h2>
          <p className="text-muted-foreground">Update account details and permissions.</p>
        </div>
        <Link href={`/superadmin/accounts/${accountId}`} className="text-indigo-600 hover:underline">
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
              <Input 
                id="firstName" 
                name="firstName" 
                value={form.firstName} 
                onChange={onChange}
                onBlur={() => handleFieldBlur("firstName")}
                className={fieldErrors.firstName ? "border-red-500" : ""}
              />
              {fieldErrors.firstName && <p className="text-red-500 text-xs mt-1">{fieldErrors.firstName}</p>}
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input 
                id="lastName" 
                name="lastName" 
                value={form.lastName} 
                onChange={onChange}
                onBlur={() => handleFieldBlur("lastName")}
                className={fieldErrors.lastName ? "border-red-500" : ""}
              />
              {fieldErrors.lastName && <p className="text-red-500 text-xs mt-1">{fieldErrors.lastName}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                name="email" 
                value={form.email} 
                onChange={onChange}
                onBlur={() => handleFieldBlur("email")}
                className={fieldErrors.email ? "border-red-500" : ""}
              />
              {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
            </div>
            {!isClient && (
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
            )}
            {isClient && (
              <div>
                <Label htmlFor="roleId">Role</Label>
                <Input id="roleId" name="roleId" value="Client" disabled className="bg-gray-50" />
              </div>
            )}
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
              <Input 
                id="phoneNumber" 
                name={isClient ? "phone" : "phoneNumber"}
                value={isClient ? form.phone : form.phoneNumber} 
                onChange={onChange}
                onBlur={() => handleFieldBlur("phoneNumber")}
                className={fieldErrors.phoneNumber ? "border-red-500" : ""}
              />
              {fieldErrors.phoneNumber && <p className="text-red-500 text-xs mt-1">{fieldErrors.phoneNumber}</p>}
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
            <Input 
              id="emergencyContactPhone" 
              name="emergencyContactPhone" 
              value={form.emergencyContactPhone} 
              onChange={onChange}
              onBlur={() => handleFieldBlur("emergencyContactPhone")}
              className={fieldErrors.emergencyContactPhone ? "border-red-500" : ""}
            />
            {fieldErrors.emergencyContactPhone && <p className="text-red-500 text-xs mt-1">{fieldErrors.emergencyContactPhone}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" asChild>
              <Link href={`/superadmin/accounts/${accountId}`}>Cancel</Link>
            </Button>
            <Button onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
            {!isFromClientsTable && isClerkId && (
              <Button variant={form.status === "suspended" ? "secondary" : "outline"} onClick={onToggleSuspend}>
                {form.status === "suspended" ? "Unsuspend" : "Suspend"}
              </Button>
            )}
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
