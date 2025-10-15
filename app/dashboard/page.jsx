"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AddAppointmentModal from "@/components/AddAppointmentModal";
import {
  Users,
  Calendar,
  AlertTriangle,
  FileText,
  Clock,
  Bell,
  Plus,
  BarChart3,
  Edit,
  Eye,
  Briefcase,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";

export function DashboardOverview() {
  const [metrics, setMetrics] = useState({
    clients: 0,
    sessions: 0,
    highRisk: 0,
    notes: 0,
    totalClients: 0,
    newClientsThisMonth: 0,
    completedClients: 0,
  });
  const [notifications, setNotifications] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [recentClients, setRecentClients] = useState([]);
  const router = useRouter();

  // Fetch metrics, notifications, appointments
  useEffect(() => {
    async function fetchData() {
      try {
        const [metricsRes, notifRes, appointRes, recentClientsRes] = await Promise.all([
          fetch("/api/metrics"),
          fetch("/api/notifications"),
          fetch("/api/appointments/today"),
          fetch("/api/clients/recent"),
        ]);

        const [metricsData, notifData, appointData, recentClientsData] = await Promise.all([
          metricsRes.json(),
          notifRes.json(),
          appointRes.json(),
          recentClientsRes.json(),
        ]);

        setMetrics({
          clients: metricsData.myClients || 0,
          sessions: metricsData.todaysSessions || 0,
          highRisk: metricsData.highRiskClients || 0,
          notes: metricsData.pendingNotes || 0,
          totalClients: metricsData.totalClients || 0,
          newClientsThisMonth: metricsData.newClientsThisMonth || 0,
          completedClients: metricsData.completedClients || 0,
        });

        setNotifications(notifData || []);
        setAppointments(appointData || []);
        setRecentClients(recentClientsData || []);
      } catch (err) {
        console.error("Error loading dashboard:", err);
      }
    }
    fetchData();
  }, []);

  // ✅ Fix Add Appointment — convert modal data to backend format
  const handleAddAppointment = async (formData) => {
    try {
      const appointmentPayload = {
        client_id: formData.client_id || formData.client, // adapt if modal passes name
        appointment_date: new Date().toISOString().split("T")[0],
        appointment_time: formData.time || "09:00",
        type: formData.type || "Session",
        duration: formData.duration || "60",
        details: formData.details || "",
      };

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointmentPayload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Backend error:", errorData);
        throw new Error("Failed to add appointment");
      }

      const created = await res.json();
      setAppointments((prev) => [...prev, created]);
    } catch (err) {
      console.error("Add appointment error:", err);
      alert("Failed to add appointment. Check console for details.");
    }
  };

  // Handle Quick Actions
  const handleNavigate = (path) => router.push(path);

  return (
    <div className="min-h-screen bg-teal-50 p-8">
      {/* ===== Metrics Row ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <MetricCard icon={Users} label="Active Clients" value={metrics.clients} />
        <MetricCard icon={Calendar} label="Today's Sessions" value={metrics.sessions} />
        <MetricCard icon={AlertTriangle} label="High-Risk Clients" value={metrics.highRisk} />
        <MetricCard icon={FileText} label="Pending Notes" value={metrics.notes} />
      </div>

      {/* ===== Additional Metrics Row ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <MetricCard icon={Briefcase} label="Total Clients" value={metrics.totalClients} />
        <MetricCard icon={TrendingUp} label="New Clients This Month" value={metrics.newClientsThisMonth} />
        <MetricCard icon={Users} label="Completed Clients" value={metrics.completedClients} />
      </div>

      {/* ===== Notifications & Appointments Section ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#CDE7E4] rounded-2xl shadow-md p-6"
        >
          <h2 className="text-md font-semibold mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-700" /> Recent Notifications
          </h2>
          <div className="space-y-3">
            {notifications.length > 0 ? (
              notifications.map((n, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-4 shadow-sm flex justify-between items-center"
                >
                  <p className="text-gray-700 text-sm">{n.message}</p>
                  <span className="text-xs text-gray-500">{n.timeAgo}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No new notifications.</p>
            )}
          </div>
        </motion.div>

        {/* Appointments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#CDE7E4] rounded-2xl shadow-md p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-md font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-700" /> Today’s Schedule
            </h2>
            <AddAppointmentModal onAdd={handleAddAppointment} />
          </div>

          <div className="space-y-3">
            {appointments.length > 0 ? (
              appointments.map((a) => (
                <div
                  key={a.id}
                  className="bg-white rounded-xl p-4 shadow-sm flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      {a.client?.name || "Unknown Client"}
                    </p>
                    <p className="text-sm text-gray-500">{a.type}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-semibold text-gray-700">
                      {new Date(a.appointment_time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full mt-1">
                      {a.status || "Confirmed"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No appointments scheduled today.</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* ===== Recent Clients Section ===== */}
      <div className="bg-white rounded-2xl shadow-md p-6 mb-10">
        <h2 className="text-md font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-700" /> Recent Clients
        </h2>
        <div className="space-y-3">
          {recentClients.length > 0 ? (
            recentClients.map((client) => (
              <div
                key={client.id}
                className="bg-gray-50 rounded-xl p-4 shadow-sm flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-gray-800">
                    {client.client_first_name} {client.client_last_name}
                  </p>
                  <p className="text-sm text-gray-500">{client.email}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-semibold text-gray-700">
                    {new Date(client.created_at).toLocaleDateString()}
                  </span>
                  <span className={`bg-${client.risk_level === 'High' ? 'red' : 'green'}-500 text-white text-xs px-3 py-1 rounded-full mt-1`}>
                    {client.risk_level || "N/A"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No recent clients.</p>
          )}
        </div>
      </div>

      {/* ===== Quick Actions ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <QuickActionCard
          icon={Plus}
          title="Add Client"
          onClick={() => handleNavigate("/clients/new")}
        />
        <QuickActionCard
          icon={Eye}
          title="View Clients"
          onClick={() => handleNavigate("/clients")}
        />
        <QuickActionCard
          icon={Edit}
          title="Write Note"
          onClick={() => handleNavigate("/notes")}
        />
        <QuickActionCard
          icon={BarChart3}
          title="View Reports"
          onClick={() => handleNavigate("/reports")}
        />
      </div>
    </div>
  );
}

// --- Reusable Metric Card ---
function MetricCard({ icon: Icon, label, value }) {
  return (
    <Card className="rounded-2xl shadow-md border-none">
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
        </div>
        <Icon className="w-8 h-8 text-blue-500" />
      </CardContent>
    </Card>
  );
}

// --- Quick Action Card ---
function QuickActionCard({ icon: Icon, title, onClick }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="cursor-pointer bg-white rounded-2xl shadow-md p-6 flex flex-col items-center justify-center text-center hover:shadow-lg"
      onClick={onClick}
    >
      <Icon className="w-8 h-8 mb-3 text-blue-500" />
      <p className="font-medium text-gray-700">{title}</p>
    </motion.div>
  );
}

export default DashboardOverview;
