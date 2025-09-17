


"use client"


import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Input } from "@/components/ui/input.jsx"
import { Textarea } from "@/components/ui/textarea.jsx"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Clock, CheckCircle, XCircle, Info, Phone, Mail, MapPin, User, FileText, BarChart3, AlertTriangle, Calendar, MessageSquare, Edit, Eye, Download, Share2, Shield } from "lucide-react"


import { ReferralStatusTracker } from "../referrals/page.jsx"
import { DashboardOverview } from "../dashboard/page.jsx"
import ClientActionButtons from "@/components/ClientActionButtons.jsx"
import ReferralActions from "@/components/ReferralActions.jsx"
import NewNoteModal from "@/components/Notes/NewNoteModal.jsx"
import ViewNoteModal from "@/components/Notes/ViewNoteModal.jsx"
import EditNoteModal from "@/components/Notes/EditNoteModal.jsx"

import EmergencyCallModal from "@/components/crisis/EmergencyCallModal.jsx"
import CrisisHotlineModal from "@/components/crisis/CrisisHotlineModal.jsx"
import SafetyPlanModal from "@/components/clients/SafetyPlanModal.jsx"
import ContactClientModal from "@/components/crisis/ContactClientModal.jsx"
import UpdateRiskStatusModal from "@/components/crisis/UpdateRiskStatusModal.jsx"



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
    {
      id: "3",
      clientName: "Emma Davis",
      age: 42,
      referralSource: "Hospital Emergency Department",
      reason: "Crisis intervention needed for severe depression",
      priority: "Critical",
      submittedDate: "2024-01-16",
      status: "pending",
      contactInfo: {
        phone: "(555) 345-6789",
        email: "emma.davis@email.com",
        address: "789 Pine St, City, State 12345",
        emergencyContact: "Robert Davis (Husband) - (555) 654-3210",
      },
      additionalNotes: "Patient was brought in after suicide attempt. Requires immediate attention.",
      submittedBy: "ER Social Worker",
    },
  ])

  const [clients] = useState([
    { id: 1, name: "Alice Smith", status: "Active", lastSession: "2024-01-10", riskLevel: "Low" },
    { id: 2, name: "Bob Johnson", status: "Active", lastSession: "2024-01-08", riskLevel: "Medium" },
    { id: 3, name: "Carol Davis", status: "On Hold", lastSession: "2024-01-05", riskLevel: "High" },
  ]);

  const [schedule] = useState([
    { id: 1, time: "09:00", client: "Alice Smith", type: "Individual Session", duration: "50 min" },
    { id: 2, time: "10:30", client: "Bob Johnson", type: "Group Therapy", duration: "90 min" },
    { id: 3, time: "14:00", client: "Carol Davis", type: "Assessment", duration: "60 min" },
  ]);


  // Modal state management
  const [modals, setModals] = useState({
    newNote: false,
    viewNote: false,
    editNote: false,
    emergencyCall: false,
    crisisHotline: false,
    supervisorCall: false,
    contactClient: false,
    updateRiskStatus: false,
    safetyPlan: false,
    crisisResources: false,
    crisisProtocols: false,
  })

  const [selectedNote, setSelectedNote] = useState(null)


  // Handler for updating referral status
  const handleReferralStatusUpdate = (referralId, updatedReferral) => {
    setReferrals((prevReferrals) =>
      prevReferrals.map((ref) =>
        ref.id === referralId ? updatedReferral : ref
      )
    );
  };

  const handleAcceptReferral = (id) => {
    setReferrals((prev) =>
      prev.map((ref) =>
        ref.id === id
          ? {
            ...ref,
            status: "accepted",
            processedDate: new Date().toISOString().split("T")[0],
            processedBy: userName,
          }
          : ref,
      ),
    )
  }

  const handleDeclineReferral = (id) => {
    setReferrals((prev) =>
      prev.map((ref) =>
        ref.id === id
          ? {
            ...ref,
            status: "declined",
            processedDate: new Date().toISOString().split("T")[0],
            processedBy: userName,
          }
          : ref,
      ),
    )
  }

  const handleRequestMoreInfo = (id) => {
    setReferrals((prev) =>
      prev.map((ref) =>
        ref.id === id
          ? {
            ...ref,
            status: "more-info-requested",
            processedDate: new Date().toISOString().split("T")[0],
            processedBy: userName,
          }
          : ref,
      ),
    )
  }

  const openModal = (modalName, item = null) => {
    setSelectedNote(item)
    setModals(prev => ({ ...prev, [modalName]: true }))
  }

  const closeModal = (modalName) => {
    setModals(prev => ({ ...prev, [modalName]: false }))
    setSelectedNote(null)
  }


  if (userRole === "admin") {
    return <AdminDashboard />
  }

  const tabs =
    userRole === "team-leader"
      ? ["Overview", "Referrals", "Clients", "Schedule", "Notes", "Crisis", "Reports", "Tracking"]
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
        <TabsList
          className={`grid w-full ${userRole === "team-leader" ? "grid-cols-4 lg:grid-cols-8" : "grid-cols-3 lg:grid-cols-6"}`}
        >
          {tabs.map((tab) => (
            <TabsTrigger key={tab} value={tab} className="text-xs">
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="Overview" className="space-y-6">


          <DashboardOverview userRole={userRole} />


        </TabsContent>

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
                    .sort((a, b) => {
                      // Sort by priority: Critical > High > Medium > Low
                      const priorityOrder = { "Critical": 4, "High": 3, "Medium": 2, "Low": 1 };
                      return priorityOrder[b.priority] - priorityOrder[a.priority];
                    })
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
                                    referral.priority === "Critical"
                                      ? "destructive"
                                      : referral.priority === "High"
                                        ? "default"
                                        : referral.priority === "Medium"
                                          ? "secondary"
                                          : "outline"
                                  }
                                  className={
                                    referral.priority === "Critical"
                                      ? "bg-red-600 text-white animate-pulse"
                                      : referral.priority === "High"
                                        ? "bg-orange-500 text-white"
                                        : ""
                                  }
                                >
                                  {referral.priority} Priority
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

                        <ReferralActions
                          referral={referral}
                          onStatusUpdate={handleReferralStatusUpdate}
                          userRole={userRole}
                        />
                      </div>
                    ))}
                  {referrals.filter((r) => r.status === "pending").length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="mx-auto h-16 w-16 mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No pending referrals</h3>
                      <p className="text-sm">All referrals have been processed.</p>
                    </div>
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
                            className={
                              referral.status === "accepted" ? "bg-green-600" :
                                referral.status === "more-info-requested" ? "bg-orange-100 text-orange-800" : ""
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
                    <ClientActionButtons client={client} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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

        <TabsContent value="Notes" className="space-y-6">

          <NewNoteModal
            isOpen={modals.newNote}
            onClose={() => closeModal('newNote')}
            clients={clients}
          />

          <ViewNoteModal
            isOpen={modals.viewNote}

            onClose={() => closeModal('viewNote')}
            onEdit={(note) => openModal('editNote', note)}
            note={selectedNote}
          />


          <EditNoteModal
            isOpen={modals.editNote}

            onClose={() => closeModal('editNote')}
            note={selectedNote}
          />
          <Card>
            <CardHeader>
              <CardTitle>Session Notes</CardTitle>
              <CardDescription>Document and review client session notes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">


              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Recent Session Notes</h3>
                  <Button onClick={() => openModal('newNote')}>
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

                        <Button variant="outline" size="sm" onClick={() => openModal('viewNote', note)}>


                          View Full Note
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openModal('editNote', note)} >
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>


              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="Crisis" className="space-y-6">

          <EmergencyCallModal
            isOpen={modals.emergencyCall}
            onClose={() => closeModal('emergencyCall')}
          />
          <CrisisHotlineModal
            isOpen={modals.crisisHotline}
            onClose={() => closeModal('crisisHotline')}
          />
          <SafetyPlanModal
            isOpen={modals.safetyPlan}
            onClose={() => closeModal('safetyPlan')}
          />
          <ContactClientModal
            isOpen={modals.contactClient}
            onClose={() => closeModal('contactClient')}
            client={selectedNote}
          />
          <UpdateRiskStatusModal
            isOpen={modals.updateRiskStatus}
            onClose={() => closeModal('updateRiskStatus')}
            client={selectedNote}
          />


          {/* Inline Supervisor Modal */}
          <Dialog open={modals.supervisorCall} onOpenChange={() => closeModal('supervisorCall')}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Supervisor
                </DialogTitle>
                <DialogDescription>
                  Reach out to your supervisor for guidance
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>On-Call Supervisor</Label>
                  <p className="text-sm font-medium">Dr. Sarah Mitchell</p>
                  <p className="text-sm text-gray-600">(555) 999-1234</p>
                </div>
                <div className="space-y-2">
                  <Label>Reason for Contact</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emergency">Emergency consultation</SelectItem>
                      <SelectItem value="clinical">Clinical guidance</SelectItem>
                      <SelectItem value="ethical">Ethical consultation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => closeModal('supervisorCall')}>Cancel</Button>
                <Button onClick={() => {
                  closeModal('supervisorCall')
                  alert('Calling supervisor...')
                }}>
                  <Phone className="h-4 w-4 mr-2" />
                  Call Supervisor
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>


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
                  <Button className="bg-red-600 hover:bg-red-700 h-16" onClick={() => openModal('emergencyCall')}>
                    <div className="text-center">
                      <Phone className="h-6 w-6 mx-auto mb-1" />
                      <div className="text-sm">Emergency Services</div>
                      <div className="text-xs">911</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="border-red-300 h-16 bg-transparent" onClick={() => openModal('crisisHotline')}>
                    <div className="text-center">
                      <Phone className="h-6 w-6 mx-auto mb-1" />
                      <div className="text-sm">Crisis Hotline</div>
                      <div className="text-xs">988</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="border-red-300 h-16 bg-transparent" onClick={() => openModal('supervisorCall')}>
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
                        <Button size="sm" onClick={() => openModal('contactClient', client)}>Contact Now</Button>
                        {/* <Button variant="outline" size="sm" onClick={() => openModal('UpdateRiskStatus', client)}>
                          Update Status
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openModal('newNote', { client: client.name, template: 'Crisis Intervention' })}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Add Note
                        </Button> */}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>


        </TabsContent>

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

        {userRole === "team-leader" && (
          <TabsContent value="Tracking" className="space-y-6">
            <ReferralStatusTracker userRole="team-leader" />
          </TabsContent>
        )}
      </Tabs>
    </main>
  );
}
