"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Bell, 
  Lock, 
  Edit, 
  Save,
  ArrowLeft,
  Settings,
  Award,
  Clock,
  Users
} from "lucide-react"
import { useRouter } from "next/navigation"

function getInitials(name) {
  if (!name) return "TL"
  const parts = name.trim().split(" ")
  const first = parts[0]?.[0] ?? ""
  const last = parts[1]?.[0] ?? ""
  return (first + last || first || "TL").toUpperCase()
}

export default function ProfilePage({ userRole = "team-leader", userName = "Team Leader User" }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  
  // Role-specific profile data
  const getProfileData = () => {
    const baseData = {
      name: userName,
      phone: "(555) 123-4567",
      location: "Calgary, Alberta, CA",
      bio: "Experienced mental health professional dedicated to providing comprehensive care and support to clients in crisis situations.",
      notifications: {
        email: true,
        sms: false,
        push: true,
        crisis: true
      },
      privacy: {
        profile: "team",
        contact: "organization",
        schedule: "team"
      }
    }

    switch(userRole) {
      case "admin":
        return {
          ...baseData,
          email: "admin@safespace.com",
          department: "Administration",
          position: "System Administrator",
          startDate: "2021-01-15",
          license: "Healthcare Administrator (CHA)",
          supervisor: null,
          bio: "System administrator responsible for platform management, user oversight, and organizational compliance.",
          specializations: ["System Management", "Data Analytics", "Compliance", "User Training"],
          permissions: ["Full System Access", "User Management", "Report Generation", "System Configuration"]
        }
      
      case "team-leader":
        return {
          ...baseData,
          email: "team.leader@safespace.com",
          department: "Mental Health Services",
          position: "Team Leader",
          startDate: "2022-03-15",
          license: "Licensed Clinical Social Worker (LCSW)",
          supervisor: "Dr. Sarah Mitchell (Clinical Director)",
          specializations: ["Crisis Intervention", "Team Management", "Clinical Supervision", "Program Development"],
          permissions: ["Team Management", "Referral Processing", "Staff Supervision", "Report Access"]
        }
      
      case "support-worker":
      default:
        return {
          ...baseData,
          email: "support.worker@safespace.com",
          department: "Client Services",
          position: "Support Worker",
          startDate: "2023-06-20",
          license: "Certified Mental Health Technician (CMHT)",
          supervisor: "Team Leader - " + (userName.includes("Leader") ? "Dr. Sarah Mitchell" : "Team Leader User"),
          specializations: ["Individual Counseling", "Crisis Support", "Documentation", "Client Advocacy"],
          permissions: ["Client Management", "Session Notes", "Basic Reporting", "Crisis Response"]
        }
    }
  }

  const [profileData, setProfileData] = useState(getProfileData())

  // Role-specific stats
  const getStats = () => {
    switch(userRole) {
      case "admin":
        return [
          { label: "Total Users", value: "156", icon: Users },
          { label: "System Uptime", value: "99.9%", icon: Settings },
          { label: "Active Sessions", value: "2.1K", icon: Clock },
          { label: "Reports Generated", value: "89", icon: Award },
        ]
      
      case "team-leader":
        return [
          { label: "Team Members", value: "12", icon: Users },
          { label: "Active Clients", value: "48", icon: Calendar },
          { label: "Years Experience", value: "8", icon: Award },
          { label: "Response Time", value: "< 1hr", icon: Clock },
        ]
      
      case "support-worker":
      default:
        return [
          { label: "Active Clients", value: "18", icon: Users },
          { label: "Sessions This Month", value: "67", icon: Calendar },
          { label: "Years Experience", value: "2", icon: Award },
          { label: "Response Time", value: "< 2hrs", icon: Clock },
        ]
    }
  }

  const stats = getStats()

  const handleSave = () => {
    console.log('Saving profile:', profileData)
    setIsEditing(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            </div>
            <Button 
              variant={isEditing ? "default" : "outline"}
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Profile Overview */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <Avatar className="h-24 w-24">
                    <AvatarFallback className="bg-teal-100 text-teal-700 text-xl">
                      {getInitials(profileData.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{profileData.name}</h2>
                    <p className="text-gray-600">{profileData.position}</p>
                    <p className="text-sm text-gray-500">{profileData.department}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge variant="secondary">{profileData.license}</Badge>
                    {userRole === "team-leader" && (
                      <Badge variant="default">Team Leader</Badge>
                    )}
                    {userRole === "admin" && (
                      <Badge variant="destructive">Admin</Badge>
                    )}
                  </div>

                  <div className="w-full pt-4 space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{profileData.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{profileData.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{profileData.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>Joined {new Date(profileData.startDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Performance Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                      <stat.icon className="h-6 w-6 mx-auto mb-2 text-teal-600" />
                      <div className="text-xl font-semibold text-gray-900">{stat.value}</div>
                      <div className="text-xs text-gray-600">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

        
              
          
        </div>
      </div>
    </div>
  )
}