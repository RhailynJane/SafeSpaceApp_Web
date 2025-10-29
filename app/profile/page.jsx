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
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    profile_image_url: "",
  });

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
  };

  const handleSave = async () => {
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      const updatedData = await res.json();
      setProfileData(updatedData);
      setIsEditing(false);
    } else {
      // Handle error
      console.error("Failed to update profile");
    }
  };

  if (!isLoaded || !profileData) {
    return <div>Loading...</div>;
  }

  const fullName = user?.fullName || `${profileData.first_name} ${profileData.last_name}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            </div>
            <Button
              variant={isEditing ? "default" : "outline"}
              onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            >
              {isEditing ? (
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
        <Card>
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>View and edit your profile information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profileData.profile_image_url} alt={fullName} />
                <AvatarFallback className="bg-teal-100 text-teal-700 text-xl">
                  {getInitials(fullName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-semibold">{fullName}</h2>
                <p className="text-gray-500">{profileData.role}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                {isEditing ? (
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p className="mt-1">{profileData.first_name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                {isEditing ? (
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p className="mt-1">{profileData.last_name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <p className="mt-1 flex items-center text-gray-500">
                  <Mail className="h-4 w-4 mr-2" />
                  {user.primaryEmailAddress.emailAddress} (Managed by Clerk)
                </p>
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p className="mt-1 flex items-center">
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
                  <p className="mt-1">{profileData.profile_image_url || "Not set"}</p>
                )}
              </div>
               <div>
                <Label>Role</Label>
                 <p className="mt-1 flex items-center">
                   <User className="h-4 w-4 mr-2" />
                   {profileData.role}
                 </p>
               </div>
               <div>
                <Label>Joined</Label>
                 <p className="mt-1 flex items-center">
                   <Calendar className="h-4 w-4 mr-2" />
                   {new Date(profileData.created_at).toLocaleDateString()}
                 </p>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}