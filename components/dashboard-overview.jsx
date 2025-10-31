'use client';

import { useState, useEffect } from "react";
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, AlertTriangle, FileText, Calendar, UserCheck, Clock, Eye, BarChart3, Edit } from "lucide-react";
import AddAppointmentModal from "./schedule/AddAppointmentModal";


export function DashboardOverview({
  userRole,
  clients = [],
  schedule = [],
  addAppointmentModalOpen,
  setAddAppointmentModalOpen,
  onAdd,
}) {
  const metrics = getMetricsForRole(userRole);

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications/mine');
        if (response.ok) {
          const data = await response.json();
          setNotifications(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };
    fetchNotifications();
  }, []);

  const todaySchedule = schedule.filter(appt => {
    const apptDate = new Date(appt.appointment_date);
    const today = new Date();
    return (
      apptDate.getFullYear() === today.getFullYear() &&
      apptDate.getMonth() === today.getMonth() &&
      apptDate.getDate() === today.getDate()
    );
  });

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
                    <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(notification.created_at).toLocaleString()}</p>
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
            <Link href="/dashboard/schedule" passHref>
              <Button
                size="sm"
                variant="outline"
                className="border-teal-300 text-teal-700 hover:bg-teal-100 bg-transparent"
              >
                Manage
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaySchedule.length > 0 ? (
              todaySchedule.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">...</div>
                  <div>
                    <p className="font-medium text-gray-900">{appointment.client?.client_first_name} {appointment.client?.client_last_name}</p>
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
            ))
            ) : (
              <p className="text-center text-gray-500 pt-4">No appointments scheduled for today.</p>
            )}
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
            >
              <div className="p-2 bg-orange-100 rounded-lg">
                <Edit className="h-6 w-6 text-orange-600" />
              </div>
              <span className="text-sm font-medium">Case Notes</span>
            </Button>

            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-teal-50 hover:border-teal-300 bg-transparent"
            >
              <div className="p-2 bg-teal-100 rounded-lg">
                <Users className="h-6 w-6 text-teal-600" />
              </div>
              <span className="text-sm font-medium">View Clients</span>
            </Button>

            <AddAppointmentModal
              isOpen={addAppointmentModalOpen}
              onOpenChange={setAddAppointmentModalOpen}
              onAdd={onAdd}
              clients={clients}
            >
              {/* This is a custom trigger since the default one is inside the modal */}
              <Button variant="outline" className="h-24 w-full flex flex-col items-center justify-center space-y-2 hover:bg-teal-50 hover:border-teal-300 bg-transparent"><div className="p-2 bg-blue-100 rounded-lg"><Calendar className="h-6 w-6 text-blue-600" /></div><span className="text-sm font-medium">Manage Schedule</span></Button>
            </AddAppointmentModal>

            <Button
              variant="outline"
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
  );
}

const getMetricsForRole = (userRole) => {
  switch (userRole) {
    case "admin":
      return [
        { title: "Total Users", value: "1,234", icon: Users, color: "text-teal-600", bgColor: "bg-teal-100" },
        { title: "System Alerts", value: "3", icon: AlertTriangle, color: "text-red-600", bgColor: "bg-red-100" },
        { title: "Pending Referrals", value: "23", icon: FileText, color: "text-orange-600", bgColor: "bg-orange-100" },
        { title: "Active Workers", value: "89", icon: UserCheck, color: "text-green-600", bgColor: "bg-green-100" },
      ];
    case "team-leader":
      return [
        { title: "Active Clients", value: "156", icon: Users, color: "text-teal-600", bgColor: "bg-teal-100" },
        { title: "Today's Sessions", value: "12", icon: Calendar, color: "text-blue-600", bgColor: "bg-blue-100" },
        { title: "High-Risk Clients", value: "8", icon: AlertTriangle, color: "text-red-600", bgColor: "bg-red-100" },
        { title: "Pending Notes", value: "5", icon: FileText, color: "text-orange-600", bgColor: "bg-orange-100" },
      ];
    case "support-worker":
      return [
        { title: "My Clients", value: "24", icon: Users, color: "text-teal-600", bgColor: "bg-teal-100" },
        { title: "Today's Sessions", value: "6", icon: Calendar, color: "text-blue-600", bgColor: "bg-blue-100" },
        { title: "Urgent Cases", value: "3", icon: AlertTriangle, color: "text-red-600", bgColor: "bg-red-100" },
        { title: "Pending Notes", value: "2", icon: FileText, color: "text-orange-600", bgColor: "bg-orange-100" },
      ];
    default:
      return [];
  }
};

const getNotificationIcon = (type) => {
  switch (type) {
    case "referral":
      return <FileText className="h-4 w-4" />;
    case "appointment":
      return <Clock className="h-4 w-4" />;
    case "crisis":
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case "confirmed":
      return "bg-teal-600 text-white";
    case "pending":
      return "bg-gray-400 text-white";
    default:
      return "bg-gray-400 text-white";
  }
};
