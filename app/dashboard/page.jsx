"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, AlertTriangle, FileText, Calendar, UserCheck } from "lucide-react"

export function DashboardOverview({ userRole }) {
  const metrics = getMetricsForRole(userRole)

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
    </div>
  )
}

// Role-based metric definitions
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
