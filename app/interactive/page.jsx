
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, CheckCircle, XCircle, Info, Phone, Mail, MapPin, User, FileText, BarChart3 } from "lucide-react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"


export default function InteractiveDashboard({ userRole = "support-worker", userName = "User" }) {
  const [referrals, setReferrals] = useState([
    {
      id: "1",
      clientName: "Sarah Johnson",
      age: 28,
      referralSource: "Community Health Center",
      reason: "Anxiety and depression following job loss",
      priority: "High",
      submittedDate: "2024-01-15",
      status: "pending",
      contactInfo: {
        phone: "(555) 123-4567",
        email: "sarah.j@email.com",
        address: "123 Main St, City, State 12345",
        emergencyContact: "John Johnson (Brother) - (555) 987-6543",
      },
      additionalNotes: "Client has expressed suicidal ideation. Immediate assessment recommended.",
      submittedBy: "Admin User",
    },
    {
      id: "2",
      clientName: "Michael Chen",
      age: 35,
      referralSource: "Primary Care Physician",
      reason: "PTSD symptoms after car accident",
      priority: "Medium",
      submittedDate: "2024-01-14",
      status: "accepted",
      contactInfo: {
        phone: "(555) 234-5678",
        email: "m.chen@email.com",
        address: "456 Oak Ave, City, State 12345",
        emergencyContact: "Lisa Chen (Wife) - (555) 876-5432",
      },
      additionalNotes: "Client is motivated for treatment. Has good family support.",
      submittedBy: "Admin User",
      processedDate: "2024-01-14",
      processedBy: "Team Leader",
    },
  ])

  const [clients] = useState([
    { id: 1, name: "Alice Smith", status: "Active", lastSession: "2024-01-10", riskLevel: "Low" },
    { id: 2, name: "Bob Johnson", status: "Active", lastSession: "2024-01-08", riskLevel: "Medium" },
    { id: 3, name: "Carol Davis", status: "On Hold", lastSession: "2024-01-05", riskLevel: "High" },
  ]);

  const [schedule] = useState([
    { id: 1, time: "09:00", client: "Alice Smith", type: "Individual Session", duration: "50 min", details: "Session on coping strategies." },
    { id: 2, time: "10:30", client: "Bob Johnson", type: "Group Therapy", duration: "90 min", details: "Focus on stress management." },
    { id: 3, time: "14:00", client: "Carol Davis", type: "Assessment", duration: "60 min", details: "Initial assessment and intake." },
  ])

  // Reports state
  const [reportType, setReportType] = useState("caseload")
  const [dateRange, setDateRange] = useState("month")
  const [reportData, setReportData] = useState(null)

  // Referral actions
  const handleAcceptReferral = (id) => {
    setReferrals(prev =>
      prev.map(r => r.id === id ? { ...r, status: "accepted", processedDate: new Date().toISOString().split("T")[0], processedBy: userName } : r)
    )
  }
  const handleDeclineReferral = (id) => {
    setReferrals(prev =>
      prev.map(r => r.id === id ? { ...r, status: "declined", processedDate: new Date().toISOString().split("T")[0], processedBy: userName } : r)
    )
  }
  const handleRequestMoreInfo = (id) => {
    setReferrals(prev =>
      prev.map(r => r.id === id ? { ...r, status: "more-info-requested", processedDate: new Date().toISOString().split("T")[0], processedBy: userName } : r)
    )
  }

  // Generate reports
  const generateReport = () => {
    if (reportType === "caseload") {
      setReportData({
        totalClients: clients.length,
        activeClients: clients.filter(c => c.status === "Active").length,
        onHoldClients: clients.filter(c => c.status !== "Active").length,
      })
    } else if (reportType === "sessions") {
      setReportData({
        sessions: [
          { date: "2024-01-15", client: "Alice Smith", type: "Individual Session", duration: "50 min" },
          { date: "2024-01-14", client: "Bob Johnson", type: "Group Therapy", duration: "90 min" },
          { date: "2024-01-12", client: "Carol Davis", type: "Assessment", duration: "60 min" },
        ]
      })
    } else if (reportType === "outcomes") {
      setReportData({
        highRisk: clients.filter(c => c.riskLevel === "High").length,
        mediumRisk: clients.filter(c => c.riskLevel === "Medium").length,
        lowRisk: clients.filter(c => c.riskLevel === "Low").length,
      })
    } else if (reportType === "crisis") {
      setReportData({
        crisisReferrals: referrals.filter(r => r.priority === "High" && r.status === "pending")
      })
    }
  }

  const tabs = userRole === "team-leader"
    ? ["Overview", "Referrals", "Clients", "Schedule", "Notes", "Crisis", "Reports", "Tracking"]
    : ["Overview", "Clients", "Schedule", "Notes", "Crisis", "Reports"]
  
    { id: 1, time: "09:00", client: "Alice Smith", type: "Individual Session", duration: "50 min" },
    { id: 2, time: "10:30", client: "Bob Johnson", type: "Group Therapy", duration: "90 min" },
    { id: 3, time: "14:00", client: "Carol Davis", type: "Assessment", duration: "60 min" },
  ]);

  const tabs = ["Overview", "Clients", "Schedule", "Notes", "Crisis", "Reports"];


  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {userName}</h1>
          <p className="text-gray-600 mt-1">{userRole === "team-leader" ? "Team Leader Dashboard" : "Support Worker Dashboard"}</p>
        </div>
      </div>

      <Tabs defaultValue="Overview" className="space-y-6">
        <TabsList className={`grid w-full ${userRole === "team-leader" ? "grid-cols-4 lg:grid-cols-8" : "grid-cols-3 lg:grid-cols-6"}`}>
          {tabs.map(tab => <TabsTrigger key={tab} value={tab} className="text-xs">{tab}</TabsTrigger>)}
        </TabsList>

        {/* Overview */}
        <TabsContent value="Overview" className="space-y-6">
          <p className="text-gray-500">Overview content goes here.</p>
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
              <CardDescription>Quick summary of your dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Welcome {userName}! Use the tabs to navigate through your clients, schedule, notes, and reports.
              </p>
            </CardContent>
          </Card>

        </TabsContent>

        {/* Referrals */}
        {userRole === "team-leader" && (
          <TabsContent value="Referrals" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Referral Management</h2>
              <Badge variant="outline">{referrals.filter((r) => r.status === "pending").length} Pending</Badge>
            </div>

            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Referrals</CardTitle>
                  <CardDescription>Review and process new client referrals</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {referrals
                    .filter((r) => r.status === "pending")
                    .map((referral) => (
                      <div key={referral.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <h3 className="font-semibold text-lg">{referral.clientName}</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>Age: {referral.age}</div>
                              <div>
                                Priority:{" "}
                                <Badge
                                  variant={
                                    referral.priority === "High"
                                      ? "destructive"
                                      : referral.priority === "Medium"
                                        ? "default"
                                        : "secondary"
                                  }
                                >
                                  {referral.priority}
                                </Badge>
                              </div>
                              <div>Source: {referral.referralSource}</div>
                              <div>Submitted: {referral.submittedDate}</div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium">Reason for Referral:</h4>
                          <p className="text-sm text-gray-700">{referral.reason}</p>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium">Contact Information:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              {referral.contactInfo.phone}
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              {referral.contactInfo.email}
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {referral.contactInfo.address}
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {referral.contactInfo.emergencyContact}
                            </div>
                          </div>
                        </div>

                        {referral.additionalNotes && (
                          <div className="space-y-2">
                            <h4 className="font-medium">Additional Notes:</h4>
                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{referral.additionalNotes}</p>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={() => handleAcceptReferral(referral.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Accept
                          </Button>
                          <Button variant="destructive" onClick={() => handleDeclineReferral(referral.id)}>
                            <XCircle className="h-4 w-4 mr-2" />
                            Decline
                          </Button>
                          <Button variant="outline" onClick={() => handleRequestMoreInfo(referral.id)}>
                            <Info className="h-4 w-4 mr-2" />
                            Request More Info
                          </Button>
                        </div>
                      </div>
                    ))}
                  {referrals.filter((r) => r.status === "pending").length === 0 && (
                    <p className="text-center text-gray-500 py-8">No pending referrals</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recently Processed</CardTitle>
                  <CardDescription>Recently accepted or declined referrals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {referrals
                      .filter((r) => r.status !== "pending")
                      .map((referral) => (
                        <div key={referral.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <p className="font-medium">{referral.clientName}</p>
                            <p className="text-sm text-gray-600">Processed on {referral.processedDate}</p>
                          </div>
                          <Badge
                            variant={
                              referral.status === "accepted"
                                ? "default"
                                : referral.status === "declined"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {referral.status.replace("-", " ")}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* Clients */}
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
                      <Badge variant={client.status === "Active" ? "default" : "secondary"}>
                        {client.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        {/* Schedule */}
        <TabsContent value="Schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
              <CardDescription>Your appointments and sessions for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {schedule.map((appt) => (
                  <div key={appt.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">{appt.time}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">{appt.client}</h3>
                        <p className="text-sm text-gray-600">{appt.type} • {appt.duration}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => alert(`${appt.client} - ${appt.details}`)}>
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes */}
        
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

                <div className="space-y-3">
                  {[
                    {
                      client: "Alice Smith",
                      date: "2024-01-15",
                      type: "Individual Session",
                      summary: "Client showed improvement in anxiety management techniques.",
                    },
                    {
                      client: "Bob Johnson",
                      date: "2024-01-14",
                      type: "Group Therapy",
                      summary: "Participated actively in group discussion about coping strategies.",
                    },
                    {
                      client: "Carol Davis",
                      date: "2024-01-12",
                      type: "Assessment",
                      summary: "Initial assessment completed. Recommended weekly individual sessions.",
                    },
                  ].map((note, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{note.client}</h4>
                        <span className="text-sm text-gray-500">{note.date}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{note.type}</p>
                      <p className="text-sm">{note.summary}</p>
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm">
                          View Full Note
                        </Button>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recent Session Notes</h3>
                <Button>
                  <FileText className="h-4 w-4 mr-2" />
                  New Note
                </Button>

              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="Crisis" className="space-y-6">
          <div className="grid gap-6">
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800">Emergency Protocols</CardTitle>
                <CardDescription className="text-red-700">
                  Quick access to crisis intervention resources
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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

            <Card>
              <CardHeader>
                <CardTitle>High-Risk Clients</CardTitle>
                <CardDescription>Monitor clients requiring immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      name: "Carol Davis",
                      risk: "High",
                      lastContact: "2024-01-15",
                      reason: "Expressed suicidal ideation",
                      status: "Active monitoring",
                    },
                    {
                      name: "David Wilson",
                      risk: "Medium",
                      lastContact: "2024-01-14",
                      reason: "Substance abuse relapse",
                      status: "Weekly check-ins",
                    },
                  ].map((client, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{client.name}</h4>
                        <Badge variant={client.risk === "High" ? "destructive" : "default"}>{client.risk} Risk</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">Last contact: {client.lastContact}</p>
                      <p className="text-sm mb-2">{client.reason}</p>
                      <p className="text-sm text-blue-600">{client.status}</p>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm">Contact Now</Button>
                        <Button variant="outline" size="sm">
                          Update Status
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reports */}
         <TabsContent value="Reports" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate Reports</CardTitle>
                <CardDescription>Create custom reports for your caseload</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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

          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">Emergency Protocols</CardTitle>
              <CardDescription className="text-red-700">
                Quick access to crisis intervention resources
              </CardDescription>
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
                <Button className="w-full">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
                <CardDescription>Previously generated reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "Monthly Caseload Summary", date: "2024-01-15", type: "PDF", size: "2.3 MB" },
                    { name: "Session Outcomes Report", date: "2024-01-10", type: "Excel", size: "1.8 MB" },
                    { name: "Crisis Intervention Log", date: "2024-01-08", type: "PDF", size: "856 KB" },
                  ].map((report, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{report.name}</p>
                        <p className="text-sm text-gray-600">
                          {report.date} • {report.type} • {report.size}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Download
                        </Button>
                        <Button variant="outline" size="sm">
                          Share
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        {/* Tracking */}
        {userRole === "team-leader" && (
          <TabsContent value="Tracking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Client Tracking</CardTitle>
                <CardDescription>Monitor client progress and activities</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Tracking content placeholder</p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </main>
  );
}
