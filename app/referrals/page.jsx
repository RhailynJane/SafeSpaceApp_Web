"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Calendar,
  FileText,
  Search,
  Filter,
  Eye,
  ArrowRight,
  UserCheck,
} from "lucide-react"

export function ReferralStatusTracker({ userRole, showAllReferrals = false }) {
  const [selectedReferral, setSelectedReferral] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  
  const [trackedReferrals] = useState([
    {
      id: "1",
      clientName: "Sarah Johnson",
      age: 28,
      referralSource: "Community Health Center",
      reason: "Anxiety and depression support following recent job loss",
      priority: "High",
      submittedDate: "2024-01-14",
      currentStatus: "accepted",
      contactEmail: "sarah.johnson@email.com",
      contactPhone: "+1 (555) 123-4567",
      submittedBy: "admin@safespace.com",
      assignedTo: "Michael Chen",
      estimatedCompletionDate: "2024-01-21",
      statusHistory: [
        {
          id: "1-1",
          status: "submitted",
          timestamp: "2024-01-14 09:30:00",
          processedBy: "admin@safespace.com",
          notes: "Referral submitted via OCR processing from fax document",
        },
        {
          id: "1-2",
          status: "pending",
          timestamp: "2024-01-14 09:31:00",
          processedBy: "system",
          notes: "Referral queued for team leader review",
        },
        {
          id: "1-3",
          status: "in-review",
          timestamp: "2024-01-15 10:15:00",
          processedBy: "Dr. Sarah Johnson",
          notes: "Team leader reviewing referral details",
        },
        {
          id: "1-4",
          status: "accepted",
          timestamp: "2024-01-15 14:22:00",
          processedBy: "Dr. Sarah Johnson",
          notes: "Referral accepted and assigned to support worker",
        },
      ],
    },
    {
      id: "2",
      clientName: "David Chen",
      age: 45,
      referralSource: "Family Doctor",
      reason: "Substance abuse counseling and mental health support",
      priority: "Critical",
      submittedDate: "2024-01-13",
      currentStatus: "assigned",
      contactEmail: "dchen@email.com",
      contactPhone: "+1 (403) 555-9876",
      submittedBy: "admin@safespace.com",
      assignedTo: "Lisa Rodriguez",
      estimatedCompletionDate: "2024-01-20",
      statusHistory: [
        {
          id: "2-1",
          status: "submitted",
          timestamp: "2024-01-13 11:45:00",
          processedBy: "admin@safespace.com",
          notes: "Manual entry from phone referral",
        },
        {
          id: "2-2",
          status: "pending",
          timestamp: "2024-01-13 11:46:00",
          processedBy: "system",
        },
        {
          id: "2-3",
          status: "accepted",
          timestamp: "2024-01-13 15:30:00",
          processedBy: "Dr. Sarah Johnson",
          notes: "High priority case - expedited processing",
        },
        {
          id: "2-4",
          status: "assigned",
          timestamp: "2024-01-14 09:00:00",
          processedBy: "Dr. Sarah Johnson",
          notes: "Assigned to specialist for substance abuse counseling",
        },
      ],
    },
    {
      id: "3",
      clientName: "Maria Rodriguez",
      age: 32,
      referralSource: "Hospital Social Services",
      reason: "PTSD treatment following motor vehicle accident",
      priority: "High",
      submittedDate: "2024-01-12",
      currentStatus: "info-requested",
      contactEmail: "maria.r@gmail.com",
      contactPhone: "+1 (587) 555-2468",
      submittedBy: "admin@safespace.com",
      statusHistory: [
        {
          id: "3-1",
          status: "submitted",
          timestamp: "2024-01-12 16:20:00",
          processedBy: "admin@safespace.com",
        },
        {
          id: "3-2",
          status: "pending",
          timestamp: "2024-01-12 16:21:00",
          processedBy: "system",
        },
        {
          id: "3-3",
          status: "info-requested",
          timestamp: "2024-01-13 10:45:00",
          processedBy: "Dr. Sarah Johnson",
          notes: "Requesting additional medical records from hospital",
        },
      ],
    },
    {
      id: "4",
      clientName: "James Wilson",
      age: 38,
      referralSource: "Mental Health Clinic",
      reason: "Bipolar disorder management and therapy",
      priority: "Medium",
      submittedDate: "2024-01-11",
      currentStatus: "completed",
      contactEmail: "james.wilson@email.com",
      contactPhone: "+1 (403) 555-7890",
      submittedBy: "admin@safespace.com",
      assignedTo: "Michael Chen",
      actualCompletionDate: "2024-01-15",
      statusHistory: [
        {
          id: "4-1",
          status: "submitted",
          timestamp: "2024-01-11 14:30:00",
          processedBy: "admin@safespace.com",
        },
        {
          id: "4-2",
          status: "accepted",
          timestamp: "2024-01-11 16:45:00",
          processedBy: "Dr. Sarah Johnson",
        },
        {
          id: "4-3",
          status: "assigned",
          timestamp: "2024-01-12 09:15:00",
          processedBy: "Dr. Sarah Johnson",
        },
        {
          id: "4-4",
          status: "in-progress",
          timestamp: "2024-01-13 10:00:00",
          processedBy: "Michael Chen",
          notes: "Initial consultation completed",
        },
        {
          id: "4-5",
          status: "completed",
          timestamp: "2024-01-15 15:30:00",
          processedBy: "Michael Chen",
          notes: "Client successfully onboarded and treatment plan established",
        },
      ],
    },
  ])

  const getStatusIcon = (status) => {
    switch (status) {
      case "submitted":
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "in-review":
        return <Eye className="h-4 w-4 text-blue-600" />
      case "accepted":
      case "assigned":
      case "in-progress":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "declined":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "info-requested":
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-teal-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "submitted":
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "in-review":
        return "bg-blue-100 text-blue-800"
      case "accepted":
      case "assigned":
      case "in-progress":
        return "bg-green-100 text-green-800"
      case "declined":
        return "bg-red-100 text-red-800"
      case "info-requested":
        return "bg-orange-100 text-orange-800"
      case "completed":
        return "bg-teal-100 text-teal-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "High":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const filteredReferrals = trackedReferrals.filter((referral) => {
    const matchesSearch =
      referral.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.referralSource.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || referral.currentStatus === statusFilter
    const matchesPriority = priorityFilter === "all" || referral.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

   return <div>Filtered referrals count: {filteredReferrals.length}</div>
}