
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, AlertTriangle, FileText, Calendar, UserCheck, Clock, Eye, BarChart3, Edit,Plus } from "lucide-react"
import AddAppointmentModal from "@/components/schedule/AddAppointmentModal"
export function DashboardOverview({ userRole }) {
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

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <AddAppointmentModal
  onAdd={(newAppointment) =>
    setTodaySchedule((prev) => [...prev, newAppointment])
  }
/>

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
      {/* Quick Actions */}
<Card>
  <CardHeader>
    <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
  </CardHeader>
  <CardContent>
    
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Case Notes */}
      <Button
        variant="outline"
        onClick={() => setActiveTab("Notes")}
        className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-teal-50 hover:border-teal-300 bg-transparent"
      >
        <div className="p-2 bg-orange-100 rounded-lg">
          <Edit className="h-6 w-6 text-orange-600" />
        </div>
        <span className="text-sm font-medium">Case Notes</span>
      </Button>

      {/* View Clients */}
      <Button
        variant="outline"
        onClick={() => setActiveTab("Clients")}
        className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-teal-50 hover:border-teal-300 bg-transparent"
      >
        <div className="p-2 bg-teal-100 rounded-lg">
          <Users className="h-6 w-6 text-teal-600" />
        </div>
        <span className="text-sm font-medium">View Clients</span>
      </Button>

      {/* Manage Schedule */}
      <Button
        variant="outline"
        onClick={() => setActiveTab("Schedule")}
        className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-teal-50 hover:border-teal-300 bg-transparent"
      >
        <div className="p-2 bg-blue-100 rounded-lg">
          <Calendar className="h-6 w-6 text-blue-600" />
        </div>
        <span className="text-sm font-medium">Manage Schedule</span>
      </Button>

      {/* Generate Reports */}
      <Button
        variant="outline"
        onClick={() => setActiveTab("Reports")}
        className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-teal-50 hover:border-teal-300 bg-transparent"
      >
        <div className="p-2 bg-green-100 rounded-lg">
          <BarChart3 className="h-6 w-6 text-green-600" />
        </div>
        <span className="text-sm font-medium">Generate Reports</span>
      </Button>
    </div>
  </CardContent>
</Card>



    </div>
  )
}



// Helpers

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
