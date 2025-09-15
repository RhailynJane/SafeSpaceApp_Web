

export default function InteractiveDashboard({ userRole, userName }) {
  return (
    <div className="p-8 text-center">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <p>Welcome, {userName}!</p>
      <p className="text-gray-600 mt-2">You are logged in as: <strong>{userRole}</strong></p>
    </div>
  );
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Clock, FileText, Phone, Mail, MapPin, User, BarChart3 } from "lucide-react"

export default function InteractiveDashboard({ userRole = "support-worker", userName = "User" }) {
  const [clients] = useState([
    { id: 1, name: "Alice Smith", status: "Active", lastSession: "2024-01-10", riskLevel: "Low" },
    { id: 2, name: "Bob Johnson", status: "Active", lastSession: "2024-01-08", riskLevel: "Medium" },
    { id: 3, name: "Carol Davis", status: "On Hold", lastSession: "2024-01-05", riskLevel: "High" },
  ])

  const [schedule] = useState([
    { id: 1, time: "09:00", client: "Alice Smith", type: "Individual Session", duration: "50 min" },
    { id: 2, time: "10:30", client: "Bob Johnson", type: "Group Therapy", duration: "90 min" },
    { id: 3, time: "14:00", client: "Carol Davis", type: "Assessment", duration: "60 min" },
  ])

  const tabs =
    userRole === "team-leader"
      ? ["Overview", "Clients", "Schedule", "Notes", "Crisis", "Reports"]
      : ["Overview", "Clients", "Schedule", "Notes", "Crisis", "Reports"]

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {userName}</h1>
          <p className="text-gray-600 mt-1">
            {userRole === "team-leader" ? "Team Leader Dashboard" : "Support Worker Dashboard"}
          </p>
        </div>
      </div>

      <Tabs defaultValue="Overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          {tabs.map((tab) => (
            <TabsTrigger key={tab} value={tab} className="text-xs">
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="Overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
              <CardDescription>Quick summary of your dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Welcome {userName}! Use the tabs to navigate through your clients, schedule, notes, and reports.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="Clients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Management</CardTitle>
              <CardDescription>Manage your active clients and their information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clients.map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{client.name}</h3>
                      <p className="text-sm text-gray-600">Last session: {client.lastSession}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          client.riskLevel === "High"
                            ? "destructive"
                            : client.riskLevel === "Medium"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {client.riskLevel} Risk
                      </Badge>
                      <Badge variant={client.status === "Active" ? "default" : "secondary"}>{client.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="Schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
              <CardDescription>Your appointments and sessions for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {schedule.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">{appointment.time}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">{appointment.client}</h3>
                        <p className="text-sm text-gray-600">
                          {appointment.type} • {appointment.duration}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="Notes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Session Notes</CardTitle>
              <CardDescription>Document and review client session notes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Recent Session Notes</h3>
                  <Button>
                    <FileText className="h-4 w-4 mr-2" />
                    New Note
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Crisis Tab */}
        <TabsContent value="Crisis" className="space-y-6">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">Emergency Protocols</CardTitle>
              <CardDescription className="text-red-700">Quick access to crisis intervention resources</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button className="bg-red-600 hover:bg-red-700 h-16">
                  <div className="text-center">
                    <Phone className="h-6 w-6 mx-auto mb-1" />
                    <div className="text-sm">Emergency Services</div>
                    <div className="text-xs">911</div>
                  </div>
                </Button>
                <Button variant="outline" className="border-red-300 h-16 bg-transparent">
                  <div className="text-center">
                    <Phone className="h-6 w-6 mx-auto mb-1" />
                    <div className="text-sm">Crisis Hotline</div>
                    <div className="text-xs">988</div>
                  </div>
                </Button>
                <Button variant="outline" className="border-red-300 h-16 bg-transparent">
                  <div className="text-center">
                    <User className="h-6 w-6 mx-auto mb-1" />
                    <div className="text-sm">Supervisor</div>
                    <div className="text-xs">On-call</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="Reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Reports</CardTitle>
              <CardDescription>Create custom reports for your caseload</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Report Type</Label>
                  <Select defaultValue="caseload">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="caseload">Caseload Summary</SelectItem>
                      <SelectItem value="sessions">Session Reports</SelectItem>
                      <SelectItem value="outcomes">Outcome Metrics</SelectItem>
                      <SelectItem value="crisis">Crisis Interventions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <Select defaultValue="month">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Last Week</SelectItem>
                      <SelectItem value="month">Last Month</SelectItem>
                      <SelectItem value="quarter">Last Quarter</SelectItem>
                      <SelectItem value="year">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full mt-4">
                <BarChart3 className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}

