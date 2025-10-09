"use client"

import { useState } from "react"
import { useAuth, useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Input } from "@/components/ui/input.jsx"
import { Textarea } from "@/components/ui/textarea.jsx"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Clock, CheckCircle, XCircle, Info, Phone, Mail, MapPin, User,
  FileText, BarChart3, AlertTriangle, Calendar, MessageSquare,
  Edit, Eye, Download, Share2, Shield
} from "lucide-react"

import { ReferralStatusTracker } from "../referrals/page.jsx"
import { DashboardOverview } from "../dashboard/page.jsx"
import ClientActionButtons from "@/components/ClientActionButtons.jsx"
import ReferralActions from "@/components/ReferralActions.jsx"
import NewNoteModal from "@/components/Notes/NewNoteModal.jsx"
import ViewNoteModal from "@/components/Notes/ViewNoteModal.jsx"
import EditNoteModal from "@/components/Notes/EditNoteModal.jsx"
import EmergencyCallModal from "@/components/crisis/EmergencyCallModal.jsx"
import CrisisHotlineModal from "@/components/crisis/CrisisHotlineModal.jsx"
import ContactClientModal from "@/components/crisis/ContactClientModal.jsx"
import UpdateRiskStatusModal from "@/components/crisis/UpdateRiskStatusModal.jsx"
import AddAppointmentModal from "@/components/schedule/AddAppointmentModal"
import ViewAvailabilityModal from "@/components/schedule/ViewAvailabilityModal"
import ViewCalendarModal from "@/components/schedule/ViewCalendarModal"
import ViewDetailsModal from "@/components/schedule/ViewDetailsModal"
import ViewReportModal from "@/components/reports/ViewReportModal"

import jsPDF from "jspdf";

function InteractiveDashboardContent({ userRole = "support-worker", userName = "User" }) {
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

  const handleDeleteNote = async (noteId) => {
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        const token = await getToken();
        const res = await fetch(`/api/notes/${noteId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setNotes(prev => prev.filter(n => n.id !== noteId));
        } else {
          console.error("Failed to delete note");
        }
      } catch (error) {
        console.error("Error deleting note:", error);
      }
    }
  };

  const tabs = userRole === "team-leader"
    ? ["Overview", "Referrals", "Clients", "Schedule", "Notes", "Crisis", "Reports", "Tracking"]
    : ["Overview", "Clients", "Schedule", "Notes", "Crisis", "Reports"];

  const [modals, setModals] = useState({
    newNote: false,
    viewNote: false,
    editNote: false,
  });
  const [selectedNote, setSelectedNote] = useState(null);

  const openModal = (modalName, item = null) => {
    setSelectedNote(item);
    setModals(prev => ({ ...prev, [modalName]: true }));
  };
  const closeModal = (modalName) => setModals(prev => ({ ...prev, [modalName]: false }));

  const generateReport = () => {
    if (reportType === "caseload") {
      setReportData({
        totalClients: clients.length,
        activeClients: clients.filter(c => c.status === "Active").length,
        onHoldClients: clients.filter(c => c.status !== "Active").length,
      });
    } else if (reportType === "sessions") {
      setReportData({
        sessions: [
          { date: "2024-01-15", client: "Alice Smith", type: "Individual Session", duration: "50 min" },
          { date: "2024-01-14", client: "Bob Johnson", type: "Group Therapy", duration: "90 min" },
          { date: "2024-01-12", client: "Carol Davis", type: "Assessment", duration: "60 min" },
        ]
      });
    } else if (reportType === "outcomes") {
      setReportData({
        highRisk: clients.filter(c => c.riskLevel === "High").length,
        mediumRisk: clients.filter(c => c.riskLevel === "Medium").length,
        lowRisk: clients.filter(c => c.riskLevel === "Low").length,
      });
    } else if (reportType === "crisis") {
      setReportData({
        crisisReferrals: referrals.filter(r => r.priority === "High" && r.status === "pending")
      });
    }
  };

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {userName}</h1>
          <p className="text-gray-600 mt-1">{userRole === "team-leader" ? "Team Leader Dashboard" : "Support Worker Dashboard"}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Tabs defaultValue="Overview" className="space-y-6">
        <TabsList className={`grid w-full ${userRole === "team-leader" ? "grid-cols-4 lg:grid-cols-8" : "grid-cols-3 lg:grid-cols-6"}`}>
          {tabs.map(tab => <TabsTrigger key={tab} value={tab} className="text-xs">{tab}</TabsTrigger>)}
        </TabsList>

        


        

        {/* Overview */}
        <TabsContent value="Overview" className="space-y-6">
          <DashboardOverview userRole={userRole} />
        </TabsContent>

        {userRole === "team-leader" && (
          <TabsContent value="Referrals" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Referral Management</h2>
              <Badge variant="outline">{referrals.filter(r => r.status.toLowerCase() === "pending").length} Pending</Badge>
            </div>

            <Tabs defaultValue="pending" className="space-y-4">
              <TabsList>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="processed">Processed</TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Referrals</CardTitle>
                    <CardDescription>Review and process new client referrals</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {referrals.filter(r => r.status.toLowerCase() === "pending").map(referral => (
                      <div key={referral.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <h3 className="font-semibold text-lg">{referral.client_first_name} {referral.client_last_name}</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>Age: {referral.age}</div>
                              <div>Source: {referral.referral_source}</div>
                              <div>Submitted: {new Date(referral.submitted_date).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium">Reason for Referral:</h4>
                          <p className="text-sm text-gray-700">{referral.reason_for_referral}</p>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium">Contact Information:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              {referral.phone}
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              {referral.email}
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {referral.address}
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {referral.emergency_first_name} {referral.emergency_last_name} - {referral.emergency_phone}
                            </div>
                          </div>
                        </div>

                        {referral.additional_notes && (
                          <div className="space-y-2">
                            <h4 className="font-medium">Additional Notes:</h4>
                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{referral.additional_notes}</p>
                          </div>
                        )}

                        <ReferralActions
                          referral={referral}
                          onStatusUpdate={handleReferralStatusUpdate}
                          userRole={userRole}
                        />
                      </div>
                    ))}

                    {referrals.filter(r => r.status.toLowerCase() === "pending").length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="mx-auto h-16 w-16 mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2">No pending referrals</h3>
                        <p className="text-sm">All referrals have been processed.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="processed">
                <Card>
                  <CardHeader>
                    <CardTitle>Processed Referrals</CardTitle>
                    <CardDescription>Referrals that have been accepted, declined, or are in progress.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {referrals.filter(r => r.status.toLowerCase() !== "pending").map(referral => (
                      <div key={referral.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg">{referral.client_first_name} {referral.client_last_name}</h3>
                          <Badge variant={
                            referral.status.toLowerCase() === 'accepted' ? 'default' :
                            referral.status.toLowerCase() === 'declined' ? 'destructive' :
                            'secondary'
                          }>{referral.status}</Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          Processed on: {new Date(referral.processed_date || referral.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                    {referrals.filter(r => r.status.toLowerCase() !== "pending").length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="mx-auto h-16 w-16 mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2">No processed referrals</h3>
                        <p className="text-sm">Process a referral from the 'Pending' tab.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
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
                      <h3 className="font-semibold">{client.client_first_name} {client.client_last_name}</h3>
                      <p className="text-sm text-gray-600">Last session: {new Date(client.last_session_date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          client.risk_level === "High"
                            ? "destructive"
                            : client.risk_level === "Medium"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {client.risk_level} Risk
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
              <div className="flex gap-2 mb-4">
                <AddAppointmentModal onAdd={handleAddAppointment} />
                <ViewAvailabilityModal
                  availability={[
                    { day: "Monday", time: "10:00 AM - 12:00 PM" },
                    { day: "Wednesday", time: "2:00 PM - 4:00 PM" },
                    { day: "Friday", time: "9:00 AM - 11:00 AM" },
                  ]}
                />
                <ViewCalendarModal schedule={schedule} />
              </div>

              <div className="space-y-4">
                {schedule.length > 0 ? (
                  schedule.map((appt) => (
                    <div key={appt.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{appt.client}</h3>
                          <p className="text-sm text-gray-600">
                            {appt.date} at {appt.time} • {appt.type} • {appt.duration}
                          </p>
                          {appt.details && (
                            <p className="text-sm text-gray-500 mt-1">{appt.details}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <ViewDetailsModal appointment={appt} />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No appointments scheduled</p>
                    <p className="text-sm mt-1">Click "Add Appointment" to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="Notes" className="space-y-6">
          <NewNoteModal
            isOpen={modals.newNote}
            onClose={() => closeModal('newNote')}
            clients={clients}
            onSave={handleCreateNote}
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
            onSave={handleUpdateNote}
          />

          <Card>
            <CardHeader>
              <CardTitle>Session Notes</CardTitle>
              <CardDescription>Document and review client session notes</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recent Session Notes</h3>
                <Button onClick={() => openModal('newNote')}>
                  <FileText className="h-4 w-4 mr-2" />
                  New Note
                </Button>
              </div>

              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{note.client.client_first_name} {note.client.client_last_name}</h4>
                      <span className="text-sm text-gray-500">{new Date(note.note_date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{note.session_type}</p>
                    <p className="text-sm">{note.summary}</p>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" onClick={() => openModal('viewNote', note)}>
                        View Full Note
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openModal('editNote', note)}>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteNote(note.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
                {notes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="mx-auto h-16 w-16 mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No notes found</h3>
                    <p className="text-sm">Click "New Note" to create one.</p>
                  </div>
                )}
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
                        <Button variant="outline" size="sm">Update Status</Button>
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
                    <Select value={reportType} onValueChange={setReportType}>
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
                    <Select value={dateRange} onValueChange={setDateRange}>
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
                <Button className="w-full" onClick={generateReport}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>

                {reportData && (
                  <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-medium mb-2">Report Generated</h4>
                    <pre className="text-sm text-gray-600">
                      {JSON.stringify(reportData, null, 2)}
                    </pre>
                  </div>
                )}
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedReport(report)
                            setModalOpen(true)
                          }}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (report.type === "PDF") {
                              const doc = new jsPDF()
                              doc.text(`Report Name: ${report.name}`, 10, 10)
                              doc.text(`Date: ${report.date}`, 10, 20)
                              doc.text(`Type: ${report.type}`, 10, 30)
                              doc.text(`Size: ${report.size}`, 10, 40)
                              doc.save(`${report.name}.pdf`)
                            } else {
                              alert("Downloading non-PDF files is not yet supported")
                            }
                          }}
                        >
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => alert(`Sharing ${report.name}`)}
                        >
                          Share
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {selectedReport && (
              <ViewReportModal
                report={selectedReport}
                open={modalOpen}
                onClose={() => setModalOpen(false)}
              />
            )}
          </div>
        </TabsContent>

        {userRole === "team-leader" && (
          <TabsContent value="Tracking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Client Tracking</CardTitle>
                <CardDescription>Monitor client progress and activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Progress Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span>Sessions Completed</span>
                        <span className="font-semibold">156</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Goals Achieved</span>
                        <span className="font-semibold">23</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Improvement Rate</span>
                        <span className="font-semibold">78%</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Team Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span>Active Staff</span>
                        <span className="font-semibold">12</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg. Caseload</span>
                        <span className="font-semibold">15</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Satisfaction Score</span>
                        <span className="font-semibold">4.2/5</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </main>
  );
}

// Page wrapper: follow the same landing-page client-side pattern — read Clerk user and normalize role
export default function InteractiveDashboard() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  const rawRole = user?.publicMetadata?.role;
  const normalizeRole = (r) => {
    if (!r) return null;
    const splitCamel = r.replace(/([a-z])([A-Z])/g, "$1_$2");
    return splitCamel.toLowerCase().replace(/[\s-]+/g, "_");
  };

  const normalized = normalizeRole(rawRole);
  // convert to hyphen style used inside the dashboard code (team-leader / support-worker)
  const userRole = normalized ? normalized.replace(/_/g, "-") : "support-worker";
  const userName = user?.fullName ?? "User";

  // Render the interactive dashboard with mock data when no user is signed in, and with real user data when available
  return <InteractiveDashboardContent userRole={userRole} userName={userName} />;
}
  


