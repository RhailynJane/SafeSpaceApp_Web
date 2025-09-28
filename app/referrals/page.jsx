"use client" // specific to Next.js App Router

import { useState } from "react" //built-in hook to manage component state
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

// functional React component - userRole and showAllReferrals passed as props
export function ReferralStatusTracker({ userRole, showAllReferrals = false }) {
  const [selectedReferral, setSelectedReferral] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  
  // Mock data of referral objects
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

  // Helper function : Map status to icon components with colors - return an icon
  // status is taken as paramter
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

  // Helper function : Map status to badge colors - return CSS class string(Tailwind) for color styling
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

  // Arrow (Helper) function: Map priority to badge colors - return tailwind class string
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

  // filters the full list of referrals based on text search, status filter and priority filter
  const filteredReferrals = trackedReferrals.filter((referral) => {
    const matchesSearch =
      referral.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.referralSource.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || referral.currentStatus === statusFilter
    const matchesPriority = priorityFilter === "all" || referral.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

    // calculate stats for overview cards
    const getStatusStats = () => {
    const stats = {
      total: trackedReferrals.length,
      pending: trackedReferrals.filter((r) => r.currentStatus === "pending").length,
      inProgress: trackedReferrals.filter((r) =>
        ["accepted", "assigned", "in-progress", "in-review"].includes(r.currentStatus),
      ).length,
      completed: trackedReferrals.filter((r) => r.currentStatus === "completed").length,
      needsAttention: trackedReferrals.filter((r) => ["info-requested", "declined"].includes(r.currentStatus)).length,
    }
    return stats
  }
  //Returns counts for different referral statuses to show in summary cards.

  const stats = getStatusStats()

  return (
    <div className="space-y-6">
      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-full">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-green-600">{stats.inProgress}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Needs Attention</p>
                <p className="text-2xl font-bold text-red-600">{stats.needsAttention}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Referral Status Tracking
          </CardTitle>
          <CardDescription>Monitor the progress of all referrals from submission to completion</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by client name or referral source..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-review">In Review</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                  <SelectItem value="info-requested">Info Requested</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Referrals List */}
          <div className="space-y-4">
            {filteredReferrals.map((referral) => (
              <div key={referral.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{referral.clientName}</h3>
                      <Badge className={getPriorityColor(referral.priority)}>{referral.priority}</Badge>
                      <Badge className={getStatusColor(referral.currentStatus)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(referral.currentStatus)}
                          {referral.currentStatus.replace("-", " ").toUpperCase()}
                        </div>
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>Age: {referral.age}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>{referral.referralSource}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Submitted: {referral.submittedDate}</span>
                      </div>
                    </div>

                    {referral.assignedTo && (
                      <div className="flex items-center gap-2 text-sm text-teal-600">
                        <UserCheck className="h-4 w-4" />
                        <span>Assigned to: {referral.assignedTo}</span>
                      </div>
                    )}

                    {/* Status Timeline Preview */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Progress:</span>
                      <div className="flex items-center gap-1">
                        {referral.statusHistory.slice(-3).map((history, index) => (
                          <div key={history.id} className="flex items-center gap-1">
                            {index > 0 && <ArrowRight className="h-3 w-3" />}
                            <div className="flex items-center gap-1">
                              {getStatusIcon(history.status)}
                              <span className="capitalize">{history.status.replace("-", " ")}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="ml-4 flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedReferral(referral)
                        setShowDetails(true)
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Timeline
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {filteredReferrals.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                <FileText className="mx-auto mb-4 h-16 w-16 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No referrals found</h3>
                <p className="text-sm">Try adjusting your search or filter criteria.</p>
              </div>
              //shown when no referral matches filters/search.
            )}
          </div>
        </CardContent>
      </Card>

      {/* Referral Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Referral Timeline - {selectedReferral?.clientName}</DialogTitle>
            <DialogDescription>Complete status history and processing timeline</DialogDescription>
          </DialogHeader>

          {selectedReferral && (
            <div className="space-y-6">
              {/* Referral Summary */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-600">Client</p>
                  <p className="font-semibold">{selectedReferral.clientName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Status</p>
                  <Badge className={getStatusColor(selectedReferral.currentStatus)}>
                    {selectedReferral.currentStatus.replace("-", " ").toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Priority</p>
                  <Badge className={getPriorityColor(selectedReferral.priority)}>{selectedReferral.priority}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Referral Source</p>
                  <p>{selectedReferral.referralSource}</p>
                </div>
                {selectedReferral.assignedTo && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Assigned To</p>
                    <p>{selectedReferral.assignedTo}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-600">Submitted By</p>
                  <p>{selectedReferral.submittedBy}</p>
                </div>
              </div>

              {/* Status Timeline */}
              <div>
                <h3 className="font-semibold mb-4">Status Timeline</h3>
                <div className="space-y-4">
                  {selectedReferral.statusHistory.map((history, index) => (
                    <div key={history.id} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className="p-2 bg-white border-2 border-gray-200 rounded-full">
                          {getStatusIcon(history.status)}
                        </div>
                        {index < selectedReferral.statusHistory.length - 1 && (
                          <div className="w-px h-8 bg-gray-200 mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getStatusColor(history.status)}>
                            {history.status.replace("-", " ").toUpperCase()}
                          </Badge>
                          <span className="text-sm text-gray-500">{history.timestamp}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-teal-100 text-teal-700">
                              {history.processedBy.split("@")[0].charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{history.processedBy}</span>
                        </div>
                        {history.notes && (
                          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{history.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Referral Details */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Referral Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-600">Contact Email</p>
                    <p>{selectedReferral.contactEmail}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600">Contact Phone</p>
                    <p>{selectedReferral.contactPhone}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="font-medium text-gray-600">Reason for Referral</p>
                    <p className="mt-1">{selectedReferral.reason}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}


          