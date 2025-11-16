"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Edit, Save, ArrowLeft, User, Mail, Phone, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

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
    if (isLoaded && user) {
      const fetchProfile = async () => {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setProfileData(data);
          setFormData({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            phone: data.phone || "",
            profile_image_url: data.profile_image_url || "",
          });
        }
      };
      fetchProfile();
    }
  }, [isLoaded, user]);

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
      const sanitizedData = {
        first_name: formData.first_name?.trim(),
        last_name: formData.last_name?.trim(),
        phone: formData.phone?.trim() || undefined,
        profile_image_url: formData.profile_image_url?.trim(),
      };

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sanitizedData),
      });

      if (res.ok) {
        const updatedData = await res.json();
        setProfileData(updatedData);
        setFormData({
          first_name: updatedData.first_name || "",
          last_name: updatedData.last_name || "",
          phone: updatedData.phone || "",
          profile_image_url: updatedData.profile_image_url || "",
        });
        setIsEditing(false);
      } else {
        const errorData = await res.json();
        const errorMsg = errorData.error || "Failed to update profile";
        setError(errorMsg);
        // Don't log to console - show in UI only
      }
    } catch (err) {
      setError("An error occurred while updating your profile");
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
                <AvatarImage src={profileData.profile_image_url} alt={fullName} />
                <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xl">
                  {getInitials(fullName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-semibold text-foreground">{fullName}</h2>
                <p className="text-muted-foreground">{profileData.role}</p>
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
                  {user.primaryEmailAddress.emailAddress} (Managed by Clerk)
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
              <div>
                <Label htmlFor="profile_image_url">Profile Image URL</Label>
                {isEditing ? (
                  <Input
                    id="profile_image_url"
                    name="profile_image_url"
                    value={formData.profile_image_url}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p className="mt-1 text-foreground">{profileData.profile_image_url || "Not set"}</p>
                )}
              </div>
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
      </div>
    </div>
  );
}