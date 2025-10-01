"use client"

import { useState } from "react"
import ViewNoteModal from "@/components/Notes/ViewNoteModal"
import NewNoteModal from "@/components/Notes/NewNoteModal"
import EditNoteModal from "@/components/Notes/EditNoteModal"
import ViewProfileModal from "@/components/clients/ViewProfileModal"
import ScheduleModal from "@/components/clients/ScheduleModal"
import ViewCalendarModal from "@/components/schedule/ViewCalendarModal"
import ViewReportModal from "@/components/reports/ViewReportModal"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, AlertTriangle, FileText, Calendar, UserCheck, Clock, Eye, BarChart3, Edit, Plus } from "lucide-react"

// This is the main component for the page, which now handles fetching user data.
export default function DashboardPage() {
  const { isLoaded, user } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-gray-600">Loading Dashboard...</p>
      </div>
    );
  }

  const userRole = user?.publicMetadata?.role || 'support-worker';

  if (userRole === 'admin') {
    return <DashboardOverview userRole="admin" />;
  }
  if (userRole === 'team-leader') {
    return <TeamLeaderDashboard />;
  }
  if (userRole === 'support-worker') {
    return <SupportWorkerDashboard />;
  }
  return <DashboardOverview userRole={userRole} />;
}

// Team Leader Dashboard
function TeamLeaderDashboard() {
  // Only show team leader metrics and actions
  // ...existing code for DashboardOverview, but restrict actions/metrics as needed...
  return <DashboardOverview userRole="team-leader" />;
}

// Support Worker Dashboard
function SupportWorkerDashboard() {
  // Only show support worker metrics and actions
  // ...existing code for DashboardOverview, but restrict actions/metrics as needed...
  return <DashboardOverview userRole="support-worker" />;
}

// Your original component and helpers remain unchanged below.
// ==========================================================


function DashboardOverview({ userRole }) {

  //Calls a helper function that returns an array of dashboard metric objects based on the userRole.
  const metrics = getMetricsForRole(userRole)

  const [notifications] = useState([
    {
      id: "1",
      type: "referral",
      title: "New client referral available",
      time: "2 hours ago",
      priority: "normal",
    },
    {
      id: "2",
      type: "appointment",
      title: "Appointment reminder: John Doe at 10:30 AM",
      time: "30 minutes ago",
      priority: "normal",
    },
    {
      id: "3",
      type: "crisis",
      title: "High-risk client flagged: Sarah Johnson",
      time: "1 hour ago",
      priority: "high",
    },
  ])

  const [todaySchedule] = useState([
    {
      id: "1",
      clientName: "Emma Watson",
      time: "10:00 AM",
      type: "Initial Consultation",
      status: "confirmed",
    },
    {
      id: "2",
      clientName: "David Chen",
      time: "02:00 PM",
      type: "Follow-up session",
      status: "confirmed",
    },
    {
      id: "3",
      clientName: "Lisa Rodriguez",
      time: "04:00 PM",
      type: "Follow-up session",
      status: "pending",
    },
  ])

  // Modal state
  const [showViewNote, setShowViewNote] = useState(false);
  const [showNewNote, setShowNewNote] = useState(false);
  const [showEditNote, setShowEditNote] = useState(false);
  const [showViewClient, setShowViewClient] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Mock data for modals
  const mockNote = {
    client: "Emma Watson",
    type: "Individual Session",
    date: "2025-09-29",
    summary: "Reviewed progress and coping strategies.",
    detailedNotes: "Client is making steady progress. Homework completed.",
    nextSteps: "Continue weekly sessions.",
  };
  const mockClient = {
    id: 1,
    name: "Emma Watson",
    status: "Active",
    lastSession: "2025-09-29",
    riskLevel: "Low",
  };
  const mockReport = {
    name: "Monthly Report",
    date: "2025-09-01",
    type: "Summary",
    size: "2 pages",
    data: { sessions: 12, notes: 5, clients: 24 },
  };
  const mockSchedule = [
    { date: "2025-09-29", time: "10:00", client: "Emma Watson" },
    { date: "2025-09-29", time: "14:00", client: "David Chen" },
  ];

  // render UI
  return (
    <div className="space-y-6 p-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* A responsive grid layout with 1–4 columns depending on screen size. */}


        {/* Loops through the metrics array and renders a Card for each. */}
        {metrics.map((metric, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{metric.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
                </div>
                <div className={`p-3 rounded-full ${metric.bgColor}`}>
                  <metric.icon className={`h-6 w-6 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Notifications */}
        <Card className="bg-teal-50 border-teal-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Recent Notifications</CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="border-teal-300 text-teal-700 hover:bg-teal-100 bg-transparent"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border ${
                  notification.priority === "high"
                    ? "bg-red-50 border-red-200"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-1 rounded ${
                      notification.priority === "high"
                        ? "bg-red-100 text-red-600"
                        : "bg-teal-100 text-teal-600"
                    }`}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card className="bg-teal-50 border-teal-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Today's Schedule</CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="border-teal-300 text-teal-700 hover:bg-teal-100 bg-transparent"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaySchedule.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-teal-700">
                      {appointment.clientName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{appointment.clientName}</p>
                    <p className="text-sm text-gray-600">{appointment.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{appointment.time}</span>
                  <Badge className={getStatusColor(appointment.status)}>
                    {appointment.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      {/* Quick Actions - interactive takes to another pages*/}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Case Notes */}
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-teal-50 hover:border-teal-300 bg-transparent"
              onClick={() => setShowViewNote(true)}
            >
              <div className="p-2 bg-orange-100 rounded-lg">
                <Edit className="h-6 w-6 text-orange-600" />
              </div>
              <span className="text-sm font-medium">Case Notes</span>
            </Button>

            {/* View Clients */}
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-teal-50 hover:border-teal-300 bg-transparent"
              onClick={() => setShowViewClient(true)}
            >
              <div className="p-2 bg-teal-100 rounded-lg">
                <Users className="h-6 w-6 text-teal-600" />
              </div>
              <span className="text-sm font-medium">View Clients</span>
            </Button>

            {/* Manage Schedule */}
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-teal-50 hover:border-teal-300 bg-transparent"
              onClick={() => setShowCalendar(true)}
            >
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium">Manage Schedule</span>
            </Button>

            {/* Generate Reports */}
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-teal-50 hover:border-teal-300 bg-transparent"
              onClick={() => setShowReport(true)}
            >
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-sm font-medium">Generate Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modals for each action */}
      <ViewNoteModal isOpen={showViewNote} onClose={() => setShowViewNote(false)} onEdit={() => setShowEditNote(true)} note={mockNote} />
      <EditNoteModal isOpen={showEditNote} onClose={() => setShowEditNote(false)} note={mockNote} />
      <NewNoteModal isOpen={showNewNote} onClose={() => setShowNewNote(false)} clients={[mockClient]} />
      <ViewProfileModal open={showViewClient} onOpenChange={setShowViewClient} client={mockClient} />
      <ViewCalendarModal schedule={mockSchedule} />
      {/* Only show calendar modal if triggered */}
      {showCalendar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded shadow-lg p-4">
            <ViewCalendarModal schedule={mockSchedule} />
            <Button className="mt-4" onClick={() => setShowCalendar(false)}>Close</Button>
          </div>
        </div>
      )}
      <ViewReportModal report={mockReport} open={showReport} onClose={() => setShowReport(false)} />
    </div>
  )
}

// Helpers
//Returns a different set of 4 dashboard metrics based on the userRole
const getMetricsForRole = (userRole) => {
  switch (userRole) {
    case "admin":
      return [
        { title: "Total Users", value: "1,234", icon: Users, color: "text-teal-600", bgColor: "bg-teal-100" },
        { title: "System Alerts", value: "3", icon: AlertTriangle, color: "text-red-600", bgColor: "bg-red-100" },
        { title: "Pending Referrals", value: "23", icon: FileText, color: "text-orange-600", bgColor: "bg-orange-100" },
        { title: "Active Workers", value: "89", icon: UserCheck, color: "text-green-600", bgColor: "bg-green-100" },
      ]
    case "team-leader":
      return [
        { title: "Active Clients", value: "156", icon: Users, color: "text-teal-600", bgColor: "bg-teal-100" },
        { title: "Today's Sessions", value: "12", icon: Calendar, color: "text-blue-600", bgColor: "bg-blue-100" },
        { title: "High-Risk Clients", value: "8", icon: AlertTriangle, color: "text-red-600", bgColor: "bg-red-100" },
        { title: "Pending Notes", value: "5", icon: FileText, color: "text-orange-600", bgColor: "bg-orange-100" },
      ]
    case "support-worker":
      return [
        { title: "My Clients", value: "24", icon: Users, color: "text-teal-600", bgColor: "bg-teal-100" },
        { title: "Today's Sessions", value: "6", icon: Calendar, color: "text-blue-600", bgColor: "bg-blue-100" },
        { title: "Urgent Cases", value: "3", icon: AlertTriangle, color: "text-red-600", bgColor: "bg-red-100" },
        { title: "Pending Notes", value: "2", icon: FileText, color: "text-orange-600", bgColor: "bg-orange-100" },
      ]
    default:
      return []
  }
}

//Returns a small icon component based on the notification type.
const getNotificationIcon = (type) => {
  switch (type) {
    case "referral":
      return <FileText className="h-4 w-4" />
    case "appointment":
      return <Clock className="h-4 w-4" />
    case "crisis":
      return <AlertTriangle className="h-4 w-4" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

//Returns Tailwind classes to style the Badge based on the appointment status (confirmed or pending).
const getStatusColor = (status) => {
  switch (status) {
    case "confirmed":
      return "bg-teal-600 text-white"
    case "pending":
      return "bg-gray-400 text-white"
    default:
      return "bg-gray-400 text-white"
  }
}

