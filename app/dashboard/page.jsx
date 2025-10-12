"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, AlertTriangle, FileText, Calendar, UserCheck, Clock, Eye, BarChart3, Edit,Plus } from "lucide-react"
import { useRouter } from "next/navigation";

//main React functional component - receive userRole as prop
export function DashboardOverview({ userRole, metrics, notifications, todaySchedule }) {
  const router = useRouter();

  // render UI
  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"> 
        {metrics && metrics.length > 0 && metrics.map((metric, index) => (
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
            {notifications && notifications.length > 0 && notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border ${
                  notification.type === "error"
                    ? "bg-red-50 border-red-200"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-1 rounded ${
                      notification.type === "error"
                        ? "bg-red-100 text-red-600"
                        : "bg-teal-100 text-teal-600"
                    }`}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(notification.timestamp).toLocaleTimeString()}</p>
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
            {todaySchedule && todaySchedule.length > 0 && todaySchedule.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-teal-700">
                      {appointment.client.client_first_name[0]}{appointment.client.client_last_name[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{appointment.client.client_first_name} {appointment.client.client_last_name}</p>
                    <p className="text-sm text-gray-600">{appointment.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{new Date(appointment.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-teal-50 hover:border-teal-300 bg-transparent"
              onClick={() => router.push('/interactive?tab=Notes')}
            >
              <div className="p-2 bg-orange-100 rounded-lg">
                <Edit className="h-6 w-6 text-orange-600" />
              </div>
              <span className="text-sm font-medium">Case Notes</span>
            </Button>

            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-teal-50 hover:border-teal-300 bg-transparent"
              onClick={() => router.push('/interactive?tab=Clients')}
            >
              <div className="p-2 bg-teal-100 rounded-lg">
                <Users className="h-6 w-6 text-teal-600" />
              </div>
              <span className="text-sm font-medium">View Clients</span>
            </Button>

            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-teal-50 hover:border-teal-300 bg-transparent"
              onClick={() => router.push('/interactive?tab=Schedule')}
            >
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium">Manage Schedule</span>
            </Button>

            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-teal-50 hover:border-teal-300 bg-transparent"
              onClick={() => router.push('/interactive?tab=Reports')}
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


// Default page export: wrap the dashboard overview and supply the user's role
export default function DashboardPage() {
  const { user } = useUser();
  const [dashboardData, setDashboardData] = useState({ metrics: [], notifications: [], todaySchedule: [] });
  const [loading, setLoading] = useState(true);

  const rawRole = user?.publicMetadata?.role ?? null;
  const userRole = rawRole ? rawRole.replace(/_/g, "-") : null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const getMetricsForRole = (userRole, metricsData) => {
    switch (userRole) {
      case "admin":
        return [
          { title: "Total Users", value: metricsData.totalUsers, icon: Users, color: "text-teal-600", bgColor: "bg-teal-100" },
          { title: "System Alerts", value: metricsData.systemAlerts, icon: AlertTriangle, color: "text-red-600", bgColor: "bg-red-100" },
          { title: "Pending Referrals", value: metricsData.pendingReferrals, icon: FileText, color: "text-orange-600", bgColor: "bg-orange-100" },
          { title: "Active Workers", value: metricsData.activeWorkers, icon: UserCheck, color: "text-green-600", bgColor: "bg-green-100" },
        ]
      case "team-leader":
        return [
          { title: "Active Clients", value: metricsData.activeClients, icon: Users, color: "text-teal-600", bgColor: "bg-teal-100" },
          { title: "Today's Sessions", value: metricsData.todaysSessions, icon: Calendar, color: "text-blue-600", bgColor: "bg-blue-100" },
          { title: "High-Risk Clients", value: metricsData.highRiskClients, icon: AlertTriangle, color: "text-red-600", bgColor: "bg-red-100" },
          { title: "Pending Notes", value: metricsData.pendingNotes, icon: FileText, color: "text-orange-600", bgColor: "bg-orange-100" },
        ]
      case "support-worker":
        return [
          { title: "My Clients", value: metricsData.myClients, icon: Users, color: "text-teal-600", bgColor: "bg-teal-100" },
          { title: "Today's Sessions", value: metricsData.todaysSessions, icon: Calendar, color: "text-blue-600", bgColor: "bg-blue-100" },
          { title: "Urgent Cases", value: metricsData.urgentCases, icon: AlertTriangle, color: "text-red-600", bgColor: "bg-red-100" },
          { title: "Pending Notes", value: metricsData.pendingNotes, icon: FileText, color: "text-orange-600", bgColor: "bg-orange-100" },
        ]
      default:
        return []
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    dashboardData && (
      <DashboardOverview 
        userRole={userRole} 
        metrics={getMetricsForRole(userRole, dashboardData.metrics)} 
        notifications={dashboardData.notifications} 
        todaySchedule={dashboardData.todaySchedule} 
      />
    )
  );
}



// Helpers

//Returns a small icon component based on the notification type.
const getNotificationIcon = (type) => {
  switch (type) {
    case "referral":
      return <FileText className="h-4 w-4" />
    case "appointment":
      return <Clock className="h-4 w-4" />
    case "crisis":
    case "error":
      return <AlertTriangle className="h-4 w-4" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

//Returns Tailwind classes to style the Badge based on the appointment status (confirmed or pending).
const getStatusColor = (status) => {
  switch (status) {
    case "confirmed":
    case "scheduled":
      return "bg-teal-600 text-white"
    case "pending":
      return "bg-gray-400 text-white"
    default:
      return "bg-gray-400 text-white"
  }
}

