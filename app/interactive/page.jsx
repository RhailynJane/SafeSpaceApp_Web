"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useSWRConfig } from "swr";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, CheckCircle, XCircle, Info, Phone, Mail, MapPin, User, FileText, BarChart3 } from "lucide-react";

import DashboardOverview from "../dashboard/page";
import ClientActionButtons from "@/components/ClientActionButtons";
import ReferralActions from "@/components/ReferralActions";
import NewNoteModal from "@/components/Notes/NewNoteModal";
import ViewNoteModal from "@/components/Notes/ViewNoteModal";
import EditNoteModal from "@/components/Notes/EditNoteModal";
import AddAppointmentModal from "@/components/schedule/AddAppointmentModal";
import ViewAvailabilityModal from "@/components/schedule/ViewAvailabilityModal";
import ViewCalendarModal from "@/components/schedule/ViewCalendarModal";
import ViewDetailsModal from "@/components/schedule/ViewDetailsModal";
import ViewReportModal from "@/components/reports/ViewReportModal";

import jsPDF from "jspdf";

function InteractiveDashboardContent({ userRole = "support-worker", userName = "User", getToken, defaultTab }) {
  const { mutate } = useSWRConfig();
  const [referrals, setReferrals] = useState([]);
  const [clients, setClients] = useState([]);
  const [notes, setNotes] = useState([]);
  const [crisisEvents, setCrisisEvents] = useState([]);
  const [schedule, setSchedule] = useState([]);

  const [reportType, setReportType] = useState("caseload");
  const [dateRange, setDateRange] = useState("month");
  const [reportData, setReportData] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!getToken) {
      console.log("getToken is not available yet");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = await getToken();

      if (!token) {
        console.log("No token available - user may not be authenticated");
        setLoading(false);
        return;
      }

      // Always fetch clients and notes
      const [clientRes, noteRes, crisisRes, appointmentRes] = await Promise.all([
        fetch("/api/clients"),
        fetch("/api/notes"),
        fetch("/api/crisis-events"),
        fetch("/api/appointments"),
      ]);

      if (clientRes.ok) {
        const clientData = await clientRes.json();
        console.log("Fetched client data:", clientData);
        setClients(Array.isArray(clientData) ? clientData : []);
      } else {
        console.error("Failed to fetch clients:", clientRes.status, clientRes.statusText);
      }

      if (noteRes.ok) {
        const noteData = await noteRes.json();
        setNotes(Array.isArray(noteData) ? noteData : []);
      } else {
        console.error("Failed to fetch notes:", noteRes.status, noteRes.statusText);
      }

      if (crisisRes.ok) {
        const crisisData = await crisisRes.json();
        setCrisisEvents(Array.isArray(crisisData) ? crisisData : []);
      } else {
        console.error("Failed to fetch crisis events:", crisisRes.status, crisisRes.statusText);
      }

      if (appointmentRes.ok) {
        const appointmentData = await appointmentRes.json();
        setSchedule(Array.isArray(appointmentData) ? appointmentData : []);
      } else {
        console.error("Failed to fetch appointments:", appointmentRes.status, appointmentRes.statusText);
      }

      // Conditionally fetch referrals
      if (userRole === "team-leader") {
        const refRes = await fetch("/api/referrals");
        if (refRes.ok) {
          const refData = await refRes.json();
          setReferrals(Array.isArray(refData) ? refData : []);
        } else {
          console.error("Failed to fetch referrals:", refRes.status, refRes.statusText);
        }
      }

    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [getToken, userRole]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddAppointment = (newAppointment) => {
    setSchedule((prev) => [...prev, newAppointment]);
    mutate("/api/dashboard");
  };
  const handleDeleteAppointment = (id) => setSchedule(prev => prev.filter(a => a.id !== id));

  const handleReferralStatusUpdate = (referralId, updatedReferral) => {
    setReferrals(prev =>
      prev.map(r => (r.id === referralId ? updatedReferral : r))
    );
  };

  const handleCreateNote = async (noteData) => {
    try {
      const token = await getToken();
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(noteData),
      });
      if (res.ok) {
        const newNote = await res.json();
        setNotes(prev => [newNote, ...prev]);
        closeModal('newNote');
      } else {
        console.error("Failed to create note");
      }
    } catch (error) {
      console.error("Error creating note:", error);
    }
  };

  const handleUpdateNote = async (noteData) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/notes/${noteData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(noteData),
      });
      if (res.ok) {
        const updatedNote = await res.json();
        setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
        closeModal('editNote');
      } else {
        console.error("Failed to update note");
      }
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };

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
        sessions: schedule

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

  const reopenReferral = async (id) => {
    setReferrals(prev => prev.map(r => r.id === id ? { ...r, status: "pending" } : r));
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

      <Tabs defaultValue={defaultTab} key={defaultTab} className="space-y-6">
        <TabsList className={`grid w-full ${userRole === "team-leader" ? "grid-cols-4 lg:grid-cols-8" : "grid-cols-3 lg:grid-cols-6"}`}>
          {tabs.map(tab => <TabsTrigger key={tab} value={tab} className="text-xs">{tab}</TabsTrigger>)}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="Overview" className="space-y-6">
          <DashboardOverview userRole={userRole} clients={clients} onAdd={handleAddAppointment} />
        </TabsContent>

        {/* Referrals Tab - Team Leaders Only */}
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
                          <Badge className={
                            referral.status.toLowerCase() === "approved"
                              ? "bg-teal-600 text-white"
                              : referral.status.toLowerCase() === "rejected"
                                ? "bg-red-500 text-white"
                                : "bg-blue-500 text-white"
                          }>
                            {referral.status}
                          </Badge>

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
                <AddAppointmentModal onAdd={handleAddAppointment} clients={clients} />
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
                          <h3 className="font-semibold">{appt.client.client_first_name} {appt.client.client_last_name}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(appt.appointment_date).toLocaleDateString()} at {new Date(appt.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {appt.type} • {appt.duration}
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
                  {crisisEvents.map((event) => {
                    const client = clients.find(c => c.id === event.client_id);
                    return (
                      <div key={event.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{client ? `${client.client_first_name} ${client.client_last_name}` : "Unknown Client"}</h4>
                          <Badge variant={event.risk_level_at_event === "High" ? "destructive" : "default"}>{event.risk_level_at_event} Risk</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Event Type: {event.event_type}</p>
                        <p className="text-sm text-gray-600 mb-1">Date: {new Date(event.event_date).toLocaleDateString()}</p>
                        <p className="text-sm mb-2">{event.description}</p>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm">Contact Now</Button>
                          <Button variant="outline" size="sm">Update Status</Button>
                        </div>
                      </div>
                    );
                  })}
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

function InteractiveDashboard() {
  const { isSignedIn, getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-gray-600">Please sign in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  const rawRole = user?.publicMetadata?.role;

  // Debug: Log the actual role from Clerk
  console.log("Raw role from Clerk:", rawRole);
  console.log("Full publicMetadata:", user?.publicMetadata);

  const normalizeRole = (r) => {
    if (!r) return null;
    // Convert any format to underscore: team-leader -> team_leader, teamLeader -> team_leader
    const splitCamel = r.replace(/([a-z])([A-Z])/g, "$1_$2");
    return splitCamel.toLowerCase().replace(/[-\s]/g, "_");
  };

  const normalized = normalizeRole(rawRole);
  const userRole = normalized ? normalized.replace(/_/g, "-") : "support-worker";
  const userName = user?.fullName ?? "User";

  console.log("Normalized role:", normalized);
  console.log("Final userRole for UI:", userRole);

  return <InteractiveDashboardContent userRole={userRole} userName={userName} getToken={getToken} defaultTab={tab || 'Overview'} />;
}

export default function InteractiveDashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InteractiveDashboard />
    </Suspense>
  )
}