"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Edit, Save, ArrowLeft, User, Mail, Phone, Calendar, Image as ImageIcon, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

function getInitials(name) {
  if (!name) return "SS";
  const parts = name.trim().split(" ");
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last || first || "SS").toUpperCase();
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    profile_image_url: "",
  });
  const [uploadError, setUploadError] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [notifPrefs, setNotifPrefs] = useState({ email: true, inApp: true });
  const [notifSaving, setNotifSaving] = useState(false);

  // Convex: load my user from Convex
  const convexUser = useQuery(
    api.users.getByClerkId,
    isLoaded && user?.id ? { clerkId: user.id } : "skip"
  );
  const updateUser = useMutation(api.users.update);

  const validatePhone = (phone) => {
    if (!phone) return "";
    const trimmed = phone.trim();
    if (!trimmed) return "";
    const regex = /^[\d\s()+-]+$/;
    if (!regex.test(trimmed)) return "Invalid phone number (digits, spaces, +, -, ( ) only)";
    if (trimmed.length > 20) return "Phone number too long (max 20 characters)";
    return "";
  };

  const validateName = (name, fieldName) => {
    if (!name || name.trim() === "") return `${fieldName} is required`;
    if (name.length > 100) return `${fieldName} too long (max 100 characters)`;
    return "";
  };

  useEffect(() => {
    if (!isLoaded || !user) return;
    // Map Convex user to profileData shape used by UI
    if (convexUser) {
      const mapped = {
        first_name: convexUser.firstName || "",
        last_name: convexUser.lastName || "",
        phone: convexUser.phoneNumber || "",
        profile_image_url: convexUser.profileImageUrl || convexUser.imageUrl || "",
        role: convexUser.roleId || "",
        created_at: convexUser.createdAt || null,
      };
      setProfileData(mapped);
      setFormData({
        first_name: mapped.first_name,
        last_name: mapped.last_name,
        phone: mapped.phone,
        profile_image_url: mapped.profile_image_url,
      });
    }
    // Load notification prefs from Clerk public metadata
    const pm = user?.publicMetadata || {};
    const prefs = pm.notifications || {};
    setNotifPrefs({
      email: prefs.email !== false,
      inApp: prefs.inApp !== false,
    });
  }, [isLoaded, user, convexUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFieldBlur = (field) => {
    let error = "";
    const value = formData[field];

    switch (field) {
      case "first_name":
        error = validateName(value, "First name");
        break;
      case "last_name":
        error = validateName(value, "Last name");
        break;
      case "phone":
        error = validatePhone(value);
        break;
      default:
        break;
    }

    if (error) {
      setFieldErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleSave = async () => {
    // Validate before saving
    const errors = {};
    errors.first_name = validateName(formData.first_name, "First name");
    errors.last_name = validateName(formData.last_name, "Last name");
    if (formData.phone) errors.phone = validatePhone(formData.phone);

    const nonEmptyErrors = Object.fromEntries(
      Object.entries(errors).filter(([_, v]) => v !== "")
    );

    if (Object.keys(nonEmptyErrors).length > 0) {
      setFieldErrors(nonEmptyErrors);
      setError("Please fix validation errors before saving");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      // Trim and sanitize data before sending
      const firstName = formData.first_name?.trim();
      const lastName = formData.last_name?.trim();
      const phoneNumber = formData.phone?.trim() || undefined;
      const profileImageUrl = formData.profile_image_url?.trim();

      if (!user?.id) throw new Error("Not authenticated");

      await updateUser({
        clerkId: user.id,
        targetClerkId: user.id,
        firstName,
        lastName,
        phoneNumber,
        profileImageUrl,
      });

      const updatedData = {
        first_name: firstName,
        last_name: lastName,
        phone: phoneNumber || "",
        profile_image_url: profileImageUrl,
        role: profileData?.role,
        created_at: profileData?.created_at,
      };
      setProfileData(updatedData);
      setFormData({
        first_name: updatedData.first_name || "",
        last_name: updatedData.last_name || "",
        phone: updatedData.phone || "",
        profile_image_url: updatedData.profile_image_url || "",
      });
      setIsEditing(false);
    } catch (err) {
      setError(err?.message || "An error occurred while updating your profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded || !profileData) {
    return <div>Loading...</div>;
  }

  const fullName = user?.fullName || `${profileData.first_name} ${profileData.last_name}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-foreground">Profile</h1>
            </div>
            <Button
              variant={isEditing ? "default" : "outline"}
              onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Save className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>View and edit your profile information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={previewUrl || profileData.profile_image_url} alt={fullName} />
                <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xl">
                  {getInitials(fullName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-semibold text-foreground">{fullName}</h2>
                <p className="text-muted-foreground">{profileData.role}</p>
              </div>
              <div className="ml-auto">
                <label htmlFor="photoUpload" className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border cursor-pointer hover:bg-accent text-sm select-none">
                  <ImageIcon className="h-4 w-4" />
                  {isUploadingPhoto ? 'Uploading…' : 'Change Photo'}
                </label>
                <input id="photoUpload" type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadError("");
                  setIsUploadingPhoto(true);
                  try {
                    // Optimistic preview for instant feedback
                    const url = URL.createObjectURL(file);
                    setPreviewUrl(url);
                    // Update Clerk profile image
                    await user.setProfileImage({ file });
                    // Refresh user instance
                    await user.reload();
                    const imageUrl = user.imageUrl;
                    // Persist to Convex profile for consistency
                    try {
                      if (user?.id) {
                        await updateUser({
                          clerkId: user.id,
                          targetClerkId: user.id,
                          profileImageUrl: imageUrl,
                        });
                      }
                    } catch {}

                    setProfileData((p) => ({ ...p, profile_image_url: imageUrl }));
                    setFormData((f) => ({ ...f, profile_image_url: imageUrl }));
                    toast.success('Profile photo updated');
                    // Revoke preview URL after final image set
                    setTimeout(() => {
                      if (url) URL.revokeObjectURL(url);
                      setPreviewUrl("");
                    }, 1500);
                  } catch (err) {
                    setUploadError('Failed to upload photo. Please try a different image.');
                    toast.error('Photo upload failed');
                  } finally {
                    setIsUploadingPhoto(false);
                    e.target.value = '';
                  }
                }} />
                {uploadError && <p className="text-red-500 text-sm mt-2">{uploadError}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                {isEditing ? (
                  <>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      onBlur={() => handleFieldBlur("first_name")}
                      className={fieldErrors.first_name ? "border-red-500" : ""}
                    />
                    {fieldErrors.first_name && (
                      <p className="text-red-500 text-sm mt-1">{fieldErrors.first_name}</p>
                    )}
                  </>
                ) : (
                  <p className="mt-1 text-foreground">{profileData.first_name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                {isEditing ? (
                  <>
                    <Input
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      onBlur={() => handleFieldBlur("last_name")}
                      className={fieldErrors.last_name ? "border-red-500" : ""}
                    />
                    {fieldErrors.last_name && (
                      <p className="text-red-500 text-sm mt-1">{fieldErrors.last_name}</p>
                    )}
                  </>
                ) : (
                  <p className="mt-1 text-foreground">{profileData.last_name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <p className="mt-1 flex items-center text-muted-foreground">
                  <Mail className="h-4 w-4 mr-2" />
                  {user.primaryEmailAddress.emailAddress}
                </p>
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                {isEditing ? (
                  <>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      onBlur={() => handleFieldBlur("phone")}
                      className={fieldErrors.phone ? "border-red-500" : ""}
                    />
                    {fieldErrors.phone && (
                      <p className="text-red-500 text-sm mt-1">{fieldErrors.phone}</p>
                    )}
                  </>
                ) : (
                  <p className="mt-1 flex items-center text-foreground">
                    <Phone className="h-4 w-4 mr-2" />
                    {profileData.phone || "Not set"}
                  </p>
                )}
              </div>
              {/* Removed Profile Image URL field per request */}
               <div>
                <Label>Role</Label>
                 <p className="mt-1 flex items-center text-foreground capitalize">
                   <User className="h-4 w-4 mr-2" />
                   {profileData.role?.replace(/_/g, ' ') || "Not assigned"}
                 </p>
               </div>
               <div>
                <Label>Joined</Label>
                 <p className="mt-1 flex items-center text-foreground">
                   <Calendar className="h-4 w-4 mr-2" />
                   {profileData.created_at ? new Date(profileData.created_at).toLocaleDateString('en-US', { 
                     year: 'numeric', 
                     month: 'long', 
                     day: 'numeric' 
                   }) : "Unknown"}
                 </p>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Security: Change Password */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Change your account password.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {passwordError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-3 py-2 rounded">
                {passwordSuccess}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="current_password">Current Password</Label>
                <Input className="mt-1" id="current_password" type="password" value={passwordForm.current} onChange={(e)=>setPasswordForm({...passwordForm,current:e.target.value})} />
              </div>
              <div>
                <Label htmlFor="new_password">New Password</Label>
                <Input className="mt-1" id="new_password" type="password" value={passwordForm.next} onChange={(e)=>setPasswordForm({...passwordForm,next:e.target.value})} />
              </div>
              <div>
                <Label htmlFor="confirm_password">Confirm New Password</Label>
                <Input className="mt-1" id="confirm_password" type="password" value={passwordForm.confirm} onChange={(e)=>setPasswordForm({...passwordForm,confirm:e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={async ()=>{
                setPasswordError(""); setPasswordSuccess("");
                const { current, next, confirm } = passwordForm;
                if (!current || !next || !confirm) { setPasswordError('All password fields are required'); return; }
                if (next !== confirm) { setPasswordError('New passwords do not match'); return; }
                if (next.length < 8 || !/[A-Z]/.test(next) || !/[a-z]/.test(next) || !/[0-9]/.test(next)) {
                  setPasswordError('Password must be 8+ chars with upper, lower, and number'); return; }
                try {
                  await user.updatePassword({ currentPassword: current, newPassword: next });
                  setPasswordSuccess('Password updated successfully');
                  toast.success('Password updated');
                  setPasswordForm({ current: "", next: "", confirm: "" });
                } catch (err) {
                  const msg = err?.errors?.[0]?.message || 'Failed to update password';
                  setPasswordError(msg);
                  toast.error(msg);
                }
              }}>
                <Lock className="h-4 w-4 mr-2" /> Update Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Choose how you want to be notified.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={notifPrefs.email} onChange={(e)=>setNotifPrefs(p=>({...p,email:e.target.checked}))} />
                <span>Email notifications</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={notifPrefs.inApp} onChange={(e)=>setNotifPrefs(p=>({...p,inApp:e.target.checked}))} />
                <span>In-app notifications</span>
              </label>
            </div>
            <div className="flex justify-end">
              <Button disabled={notifSaving} onClick={async ()=>{
                setNotifSaving(true);
                try {
                  const pm = user.publicMetadata || {};
                  await user.update({ publicMetadata: { ...pm, notifications: { email: notifPrefs.email, inApp: notifPrefs.inApp } } });
                  toast.success('Preferences saved');
                } catch (err) {
                  toast.error('Failed to save preferences');
                } finally {
                  setNotifSaving(false);
                }
              }}>Save Preferences</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}