"use client";

import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  AlertTriangle,
  FileText,
  Calendar,
  UserCheck,
  Clock,
  Bell,
  BarChart3,
  Edit,
  PlusCircle,
} from "lucide-react";
import AddAppointmentModal from "@/components/schedule/AddAppointmentModal";

import SendbirdChat from '@/components/SendbirdChat';

const fetcher = (url) => fetch(url).then((res) => res.json());

// Helpers
const getNotificationIcon = (type) => {
  switch (type) {
    case "referral":
      return <FileText className="h-4 w-4" />;
    case "appointment":
      return <Clock className="h-4 w-4" />;
    case "crisis":
    case "error":
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case "confirmed":
    case "scheduled":
      return "bg-teal-700 text-white";
    case "pending":
      return "bg-gray-400 text-white";
    default:
      return "bg-gray-400 text-white";
  }
};

const formatMetrics = (metrics) => [
  {
    title: "Total Clients",
    value: metrics.totalClients,
    icon: Users,
    bgColor: "bg-blue-100",
    color: "text-blue-600",
  },
  {
    title: "Case Notes",
    value: metrics.totalNotes,
    icon: FileText,
    bgColor: "bg-yellow-100",
    color: "text-yellow-600",
  },
  {
    title: "Appointments",
    value: metrics.totalAppointments,
    icon: Calendar,
    bgColor: "bg-green-100",
    color: "text-green-600",
  },
  {
    title: "High-Risk Clients",
    value: metrics.highRiskClients,
    icon: AlertTriangle,
    bgColor: "bg-red-100",
    color: "text-red-600",
  },
  {
    title: "Crisis Events",
    value: metrics.crisisEvents,
    icon: AlertTriangle,
    bgColor: "bg-orange-100",
    color: "text-orange-600",
  },
  {
    title: "Pending Referrals",
    value: metrics.pendingReferrals,
    icon: FileText,
    bgColor: "bg-purple-100",
    color: "text-purple-600",
  },
  {
    title: "Active Clients",
    value: metrics.activeClients,
    icon: UserCheck,
    bgColor: "bg-indigo-100",
    color: "text-indigo-600",
  },
  {
    title: "Today’s Sessions",
    value: metrics.todaysSessions,
    icon: Clock,
    bgColor: "bg-teal-100",
    color: "text-teal-600",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR("/api/dashboard", fetcher);

  const handleAddAppointment = async (newAppt) => {
    if (onAdd) {
      onAdd(newAppt);
    }

    const todayStr = new Date().toLocaleDateString('en-CA');
    const isToday = newAppt.date === todayStr;

    const newData = {
      ...data,
      upcomingAppointments: [...data.upcomingAppointments, newAppt].sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date)),
      metrics: {
        ...data.metrics,
        totalAppointments: data.metrics.totalAppointments + 1,
        todaysSessions: isToday ? data.metrics.todaysSessions + 1 : data.metrics.todaysSessions,
      }
    };

    try {
      await mutate();
    } catch (err) {
      console.error("Error revalidating dashboard after add:", err);
    }
  };

  if (isLoading) return <p className="text-gray-600">Loading dashboard...</p>;
  if (error) return <p className="text-red-600">Failed to load dashboard data.</p>;
  if (!data) return <p className="text-gray-600">Loading dashboard...</p>; // Add a check for data

  const { metrics, notifications, upcomingAppointments, role } = data || {};

  const formattedMetrics = formatMetrics(metrics || {});

  const todaysUpcomingAppointments = (upcomingAppointments || [])
    .map(appt => {
      if (!appt.date || !appt.appointment_time) {
        return { ...appt, combinedDateTime: null };
      }
      const datePart = appt.date.substring(0, 10);
      const timePart = appt.appointment_time.substring(11, 19);
      const dateStr = `${datePart}T${timePart}Z`; // Append Z for UTC
      const combinedDateTime = new Date(dateStr);
      return { ...appt, combinedDateTime };
    })
    .filter(appt => {
      if (!appt.combinedDateTime) {
        return false;
      }
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return appt.combinedDateTime >= now && appt.combinedDateTime < tomorrow;
    })
        .sort((a, b) => {
      if (!a.combinedDateTime) return 1;
      if (!b.combinedDateTime) return -1;
      return a.combinedDateTime.getTime() - b.combinedDateTime.getTime();
    });

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {formattedMetrics.map((metric, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{metric.title}</p>
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

      {/* Main Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <Card className="bg-white border-teal-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Recent Notifications</CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="border-teal-300 text-teal-700 hover:bg-teal-100 bg-transparent"
            >
              <Bell className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications?.length > 0 ? (
              notifications.map((notification) => (
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
                      <p className="text-sm text-gray-900">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">No notifications available.</p>
            )}
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card className="bg-teal-50 border-teal-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Upcoming Appointments</CardTitle>
            <AddAppointmentModal onAdd={handleAddAppointment} className="bg-white border-teal-200" />
          </CardHeader>
          <CardContent className="space-y-3">
            {todaysUpcomingAppointments.length > 0 ? (
              todaysUpcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-teal-700">
                        {appointment.client.client_first_name[0]}
                        {appointment.client.client_last_name[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {appointment.client.client_first_name}{" "}
                        {appointment.client.client_last_name}
                      </p>
                      <p className="text-sm text-gray-600">{appointment.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(appointment.date).toLocaleDateString(undefined, { timeZone: 'UTC' })} {new Date(appointment.appointment_time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">No appointments scheduled today.</p>
            )}
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
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-teal-50 hover:border-teal-300 bg-transparent"
              onClick={() => router.push('/workspace?tab=Notes')}
            >
              <div className="p-2 bg-orange-100 rounded-lg">
                <Edit className="h-6 w-6 text-orange-600" />
              </div>
              <span className="text-sm font-medium">Case Notes</span>
            </Button>

            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-teal-50 hover:border-teal-300 bg-transparent"
              onClick={() => router.push('/workspace?tab=Clients')}
            >
              <div className="p-2 bg-teal-100 rounded-lg">
                <Users className="h-6 w-6 text-teal-600" />
              </div>
              <span className="text-sm font-medium">View Clients</span>
            </Button>

            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-teal-50 hover:border-teal-300 bg-transparent"
              onClick={() => router.push('/workspace?tab=Schedule')}
            >
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium">Manage Schedule</span>
            </Button>

            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-teal-50 hover:border-teal-300 bg-transparent"
              onClick={() => router.push('/workspace?tab=Reports')}
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

function ActionButton({ label, icon, bgColor, onClick }) {
  return (
    <Button
      className={`flex flex-col items-center justify-center gap-2 p-6 rounded-xl ${bgColor} hover:opacity-90 transition`}
      onClick={onClick}
      variant="ghost"
    >
      {icon}
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </Button>
  );
}
