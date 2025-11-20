"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, AlertTriangle, FileText, Calendar, UserCheck, Clock, Eye, BarChart3, Edit, Plus } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";


export function DashboardOverview({ userRole }) {
  const { user, isLoaded } = useUser();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data from API
  useEffect(() => {
    if (!isLoaded || !user) return;
    
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) {
          const data = await res.json();
          setDashboardData(data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [isLoaded, user]);

  const metrics = dashboardData ? getMetricsForRole(userRole, dashboardData.metrics) : getMetricsForRole(userRole, {});

  const [todaySchedule, setTodaySchedule] = useState([]);

  // Load today's schedule via Convex
  const today = new Date().toISOString().split("T")[0];
  const convexToday = useQuery(
    api.appointments.listByDate,
    isLoaded && user?.id ? { clerkId: user.id, date: today } : "skip"
  );

  useEffect(() => {
    if (!Array.isArray(convexToday)) return;
    // Map Convex appointments to overview UI shape
    const mapped = convexToday.map((a) => ({
      id: a._id,
      clientName: a.clientName || "Client",
      type: a.type,
      time: a.appointmentTime,
      status: a.status || "scheduled",
    }));
    setTodaySchedule(mapped);
  }, [convexToday]);

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{metric.title}</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{metric.value}</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Today's Schedule */}
        <Card className="bg-teal-50 dark:bg-slate-800 border-teal-200 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Today's Schedule</CardTitle>
            <Link href="/workspace?tab=Schedule" passHref>
              <Button
                size="sm"
                variant="outline"
                className="border-teal-300 dark:border-slate-600 text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-slate-700 bg-transparent"
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
                className="flex items-center justify-between p-3 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-100 dark:bg-teal-800 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-teal-700 dark:text-teal-200">
                      {appointment.clientName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{appointment.clientName}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{appointment.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{appointment.time}</span>
                  <Badge className={getStatusColor(appointment.status)}>
                    {appointment.status}
                  </Badge>
                </div>
              </div>
            ))
            ) : (
              <p className="text-center text-slate-500 dark:text-slate-400 pt-4">No appointments scheduled for today.</p>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Quick Actions - interactive takes to another pages*/}
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/workspace?tab=Notes" passHref>
              <Button
                variant="outline"
                className="h-24 w-full flex flex-col items-center justify-center space-y-2 hover:bg-teal-50 dark:hover:bg-slate-700 hover:border-teal-300 dark:hover:border-teal-600 bg-transparent border-slate-300 dark:border-slate-600"
              >
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Edit className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-white">Case Notes</span>
              </Button>
            </Link>

            <Link href="/workspace?tab=Clients" passHref>
              <Button
                variant="outline"
                className="h-24 w-full flex flex-col items-center justify-center space-y-2 hover:bg-teal-50 dark:hover:bg-slate-700 hover:border-teal-300 dark:hover:border-teal-600 bg-transparent border-slate-300 dark:border-slate-600"
              >
                <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                  <Users className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-white">View Clients</span>
              </Button>
            </Link>

            <Link href="/workspace?tab=Schedule" passHref>
              <Button
                variant="outline"
                className="h-24 w-full flex flex-col items-center justify-center space-y-2 hover:bg-teal-50 dark:hover:bg-slate-700 hover:border-teal-300 dark:hover:border-teal-600 bg-transparent border-slate-300 dark:border-slate-600"
              >
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-white">Manage Schedule</span>
              </Button>
            </Link>

            <Link href="/workspace?tab=Reports" passHref>
              <Button
                variant="outline"
                className="h-24 w-full flex flex-col items-center justify-center space-y-2 hover:bg-teal-50 dark:hover:bg-slate-700 hover:border-teal-300 dark:hover:border-teal-600 bg-transparent border-slate-300 dark:border-slate-600"
              >
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-white">Generate Reports</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const getMetricsForRole = (userRole, metrics = {}) => {
  const {
    totalClients = 0,
    totalNotes = 0,
    totalAppointments = 0,
    highRiskClients = 0,
    activeClients = 0,
    todaysSessions = 0,
    pendingReferrals = 0
  } = metrics;

  switch (userRole) {
    case "admin":
    case "superadmin":
      return [
        { title: "Total Clients", value: totalClients, icon: Users, color: "text-teal-600", bgColor: "bg-teal-100" },
        { title: "High-Risk Clients", value: highRiskClients, icon: AlertTriangle, color: "text-red-600", bgColor: "bg-red-100" },
        { title: "Pending Referrals", value: pendingReferrals, icon: FileText, color: "text-orange-600", bgColor: "bg-orange-100" },
        { title: "Active Clients", value: activeClients, icon: UserCheck, color: "text-green-600", bgColor: "bg-green-100" },
      ];
    case "team-leader":
      return [
        { title: "Active Clients", value: activeClients, icon: Users, color: "text-teal-600", bgColor: "bg-teal-100" },
        { title: "Today's Sessions", value: todaysSessions, icon: Calendar, color: "text-blue-600", bgColor: "bg-blue-100" },
        { title: "High-Risk Clients", value: highRiskClients, icon: AlertTriangle, color: "text-red-600", bgColor: "bg-red-100" },
        { title: "Case Notes", value: totalNotes, icon: FileText, color: "text-orange-600", bgColor: "bg-orange-100" },
      ];
    case "support-worker":
    case "peer_support":
      return [
        { title: "My Clients", value: totalClients, icon: Users, color: "text-teal-600", bgColor: "bg-teal-100" },
        { title: "Today's Sessions", value: todaysSessions, icon: Calendar, color: "text-blue-600", bgColor: "bg-blue-100" },
        { title: "High-Risk Cases", value: highRiskClients, icon: AlertTriangle, color: "text-red-600", bgColor: "bg-red-100" },
        { title: "Case Notes", value: totalNotes, icon: FileText, color: "text-orange-600", bgColor: "bg-orange-100" },
      ];
    default:
      return [
        { title: "Total Clients", value: totalClients, icon: Users, color: "text-teal-600", bgColor: "bg-teal-100" },
        { title: "Appointments", value: totalAppointments, icon: Calendar, color: "text-blue-600", bgColor: "bg-blue-100" },
        { title: "High-Risk", value: highRiskClients, icon: AlertTriangle, color: "text-red-600", bgColor: "bg-red-100" },
        { title: "Notes", value: totalNotes, icon: FileText, color: "text-orange-600", bgColor: "bg-orange-100" },
      ];
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
