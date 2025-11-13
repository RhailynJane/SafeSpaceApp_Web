"use client";

import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import useDraggable from "../../hooks/useDraggable";
import { useAuth, useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useSWRConfig } from "swr";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Clock, CheckCircle, XCircle, Info, Phone, Mail, MapPin, User, FileText, BarChart3, Search, MoreVertical } from "lucide-react";


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
import SendbirdChat from "@/components/SendbirdChat";

import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import jsPDF from "jspdf";
import * as XLSX from 'xlsx';

function InteractiveDashboardContent({ user, userRole = "support-worker", userName = "User", getToken, defaultTab }) {
  const { mutate } = useSWRConfig();
  const [referrals, setReferrals] = useState([]);
  const [clients, setClients] = useState([]);
  const [notes, setNotes] = useState([]);
  const [crisisEvents, setCrisisEvents] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [supervisor, setSupervisor] = useState(null);
  const [dbUser, setDbUser] = useState(null);

  const [reportType, setReportType] = useState("caseload");
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  });
  const [reportData, setReportData] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskLevelFilter, setRiskLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showChat, setShowChat] = useState(false);
  const [channelUrl, setChannelUrl] = useState("");
  const [chatChannelName, setChatChannelName] = useState("Chat");

  const dragHandleRef = useRef(null);
  const position = useDraggable(dragHandleRef);

  useEffect(() => {
    const fetchSupervisor = async () => {
      try {
        const response = await fetch('/api/supervisor');
        if (response.ok) {
          const data = await response.json();
          setSupervisor(data);
        } else {
        }
      } catch (error) {
      }
    };

    fetchSupervisor();
  }, []);


  const fetchData = useCallback(async () => {
    if (!getToken) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = await getToken();

      if (!token) {
        setLoading(false);
        return;
      }

      // Always fetch clients and notes
      const [clientRes, noteRes, crisisRes, appointmentRes, auditRes] = await Promise.all([
        fetch("/api/clients"),
        fetch("/api/notes"),
        fetch("/api/crisis-events"),
        fetch("/api/appointments"),
        fetch("/api/audit-logs"),
      ]);

      if (clientRes.ok) {
        const clientData = await clientRes.json();
        setClients(Array.isArray(clientData) ? clientData : []);
      } else {
      }

      if (noteRes.ok) {
        const noteData = await noteRes.json();
        setNotes(Array.isArray(noteData) ? noteData : []);
      } else {
      }

      if (crisisRes.ok) {
        const crisisData = await crisisRes.json();
        setCrisisEvents(Array.isArray(crisisData) ? crisisData : []);
      } else {
      }

      if (appointmentRes.ok) {
        const appointmentData = await appointmentRes.json();
        setSchedule(Array.isArray(appointmentData) ? appointmentData : []);
      } else {
      }

      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditLogs(Array.isArray(auditData) ? auditData : []);
      } else {
      }

      // Conditionally fetch referrals and assignable users
      if (userRole === "team-leader") {
        const [refRes, usersRes] = await Promise.all([
          fetch("/api/referrals"),
          fetch("/api/assignable-users"),
        ]);

        if (refRes.ok) {
          const refData = await refRes.json();
          setReferrals(Array.isArray(refData) ? refData : []);
        } else {
        }

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setAssignableUsers(Array.isArray(usersData) ? usersData : []);
        } else {
        }
      });

    } catch (error) {
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
      }
    } catch (error) {
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
      }
    } catch (error) {
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
        }
      } catch (error) {
      }
    }
  };

  const tabs = userRole === "team-leader"
    ? ["Overview", "Referrals", "Clients", "Schedule", "Notes", "Crisis", "Reports", "Audit Log"]
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

  const handleCallEnd = () => {};

  const openChat = async (otherUser, channelName) => {
    let otherUserId = null;
    let dynamicChannelName = channelName;

    if (typeof otherUser === 'object' && otherUser !== null) {
      dynamicChannelName = `${otherUser.client_first_name} ${otherUser.client_last_name}`;
      
      if (otherUser.user && otherUser.user.clerk_user_id) {
        otherUserId = otherUser.user.clerk_user_id;
      } else if (otherUser.id) {
        otherUserId = otherUser.id;
      } else if (otherUser.email) {
        try {
          const response = await fetch(`/api/users/${otherUser.email}`);
          if (response.ok) {
            const data = await response.json();
            if (data.userId) {
              otherUserId = data.userId;
            }
                  }
                } catch (error) {
                  }
                }
      if (!otherUserId) {
        alert('This client does not have a user account and cannot be messaged.');
        return;
      }
    } else if (String(otherUser).includes('@')) {
      try {
        const response = await fetch(`/api/users/${otherUser}`);
        if (response.ok) {
          const data = await response.json();
          if (data.userId) {
            otherUserId = data.userId;
          }
        }
      } catch (error) {
      }
      if (!otherUserId) {
        return;
      }
    } else {
      otherUserId = otherUser;
    }

    setChatChannelName(dynamicChannelName || "Chat");

    // Create a deterministic channel URL by sorting user IDs
    const channelUrl = `client_chat_${[user.id, otherUserId].sort().join('_')}`;

    const response = await fetch('/api/sendbird', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userIds: [user.id, otherUserId],
        name: dynamicChannelName,
        channel_url: channelUrl
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      alert('Failed to create chat channel. Please try again later.');
      return;
    }

    const data = await response.json();
    setChannelUrl(data.channelUrl);
    setShowChat(true);
  };

  return (
    <main className="p-6 space-y-6">

      {/* Floating chat window (bottom-right */}
      {showChat && (
        <div
          className="draggable fixed bottom-5 right-5 w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden z-[9999]"
          style={{ top: position.y, left: position.x }}
        >
          {/* Header */}
          <div
            ref={dragHandleRef}
            className="drag-handle bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between cursor-move"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex-shrink-0">
                <img
                  src="/images/logo.png"
                  alt="profile"
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-teal-100"
                />
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm truncate">{chatChannelName}</h3>
                <p className="text-xs text-gray-500">Active now</p>
              </div>
            </div>

            {/* Right-side controls */}
            <div className="flex items-center gap-1">
              {/* Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-gray-100 rounded-full h-8 w-8">
                    <MoreVertical size={16} className="text-gray-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 z-[10000]">
                  <DropdownMenuItem
                    onClick={async () => {
                      if (!channelUrl) return alert("No channel selected.");
                      try {
                        const res = await fetch("/api/sendbird/mute", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ channelUrl, userId: user.id, mute: true }),
                        });
                        if (!res.ok) throw new Error("mute failed");
                        alert("Notifications muted for this chat.");
                      } catch (err) {
                        alert("Failed to mute notifications.");
                      }
                    }}
                  >
                    Mute notifications
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={async () => {
                      if (!channelUrl) return alert("No channel selected.");
                      if (!window.confirm("Clear all messages from this chat?")) return;
                      try {
                        const res = await fetch("/api/sendbird/clear", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ channelUrl, userId: user.id }),
                        });
                        if (!res.ok) throw new Error("clear failed");
                        alert("Chat history cleared.");
                        setShowChat(false);
                      } catch (err) {
                        alert("Failed to clear chat history.");
                      }
                    }}
                  >
                    Clear chat history
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={async () => {
                      const term = prompt("Enter a keyword to search for:");
                      if (!term) return;
                      try {
                        const res = await fetch("/api/sendbird/search", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ channelUrl, keyword: term }),
                        });
                        if (res.ok) {
                          const data = await res.json();
                          alert(`Found ${data.count ?? data.messages?.length ?? 0} results for "${term}"`);
                        } else {
                          alert("Search not implemented yet.");
                        }
                      } catch {
                        alert("Search route not available.");
                      }
                    }}
                  >
                    Search in conversation
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    onClick={async () => {
                      if (!channelUrl) return alert("No channel selected.");
                      if (!window.confirm("Are you sure you want to block this user?")) return;
                      try {
                        const mRes = await fetch("/api/sendbird/members", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ channelUrl }),
                        });
                        const mData = await mRes.json();
                        const others = (mData.members || []).filter(
                          (m) => String(m.user_id) !== String(user.id)
                        );
                        if (others.length === 0) return alert("No other member found.");
                        const targetId = others[0].user_id;
                        const bRes = await fetch("/api/sendbird/block", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ userId: user.id, targetId }),
                        });
                        if (!bRes.ok) throw new Error("block failed");
                        alert("User blocked.");
                        setShowChat(false);
                      } catch (err) {
                        alert("Failed to block user.");
                      }
                    }}
                  >
                    Block user
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* ✅ Working close button */}
              <button
                onClick={() => setShowChat(false)}
                className="ml-1 text-gray-400 hover:text-gray-600 rounded"
                aria-label="Close chat"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Chat Body */}
          <div className="flex-1 bg-white overflow-hidden">
            {channelUrl ? (
              <SendbirdChat channelUrl={channelUrl} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                Loading chat...
              </div>
            )}
          </div>
        </div>
      )}



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
          <DashboardOverview userRole={userRole} clients={clients} onAdd={handleAddAppointment} schedule={schedule} />
        </TabsContent>

        {/* Referrals Tab - Team Leaders Only */}
        {userRole === "team-leader" && (
          <TabsContent value="Referrals" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Referral Management</h2>
              <Badge variant="outline">{referrals.filter(r => r.status && ['pending', 'in-review'].includes(r.status.toLowerCase())).length} Pending</Badge>
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
                    {referrals.filter(r => r.status && ['pending', 'in-review'].includes(r.status.toLowerCase())).map(referral => (
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
                          assignableUsers={assignableUsers}
                          onStartChat={openChat}
                        />
                      </div>
                    ))}

                    {referrals.filter(r => r.status && ['pending', 'in-review'].includes(r.status.toLowerCase())).length === 0 && (
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
                    {referrals.filter(r => r.status && ['accepted', 'declined', 'more-info-requested'].includes(r.status.toLowerCase())).map(referral => (
                      <div key={referral.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg">{referral.client_first_name} {referral.client_last_name}</h3>
                          <Badge className={
                            referral.status.toLowerCase() === "accepted"
                              ? "bg-teal-600 text-white"
                              : referral.status.toLowerCase() === "declined"
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
                    {referrals.filter(r => r.status && ['accepted', 'declined', 'more-info-requested'].includes(r.status.toLowerCase())).length === 0 && (
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
              <div className="flex space-x-4 mb-4">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search clients by name..."
                    value={clientSearchQuery}
                    onChange={(e) => setClientSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={riskLevelFilter} onValueChange={setRiskLevelFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by risk level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risk Levels</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="On-Hold">On-Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-4">
                {clients
                  .filter(client =>
                    `${client.client_first_name} ${client.client_last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .filter(client =>
                    riskLevelFilter === "all" || client.risk_level === riskLevelFilter
                  )
                  .filter(client =>
                    statusFilter === "all" || client.status === statusFilter
                  )
                  .map((client) => (
                    <div key={client.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{client.client_first_name} {client.client_last_name}</h3>
                          <p className="text-sm text-gray-600">Last session: {new Date(client.last_session_date).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={client.risk_level === "High" ? "bg-red-200 text-red-800" : client.risk_level === "Medium" ? "bg-yellow-200 text-yellow-800" : "bg-teal-200 text-teal-800"}
                          >
                            {client.risk_level} Risk
                          </Badge>
                          <Badge
                            className={client.status === "Active" ? "bg-green-200 text-green-800" : client.status === "Inactive" ? "bg-orange-200 text-orange-800" : "bg-gray-200 text-gray-800"}
                          >
                            {client.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-4">
                        <ClientActionButtons client={client} onMessage={() => openChat(client)} schedule={schedule} />
                      </div>
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
                <AddAppointmentModal onAdd={handleAddAppointment} clients={clients} existingAppointments={schedule} />
                <ViewAvailabilityModal
                  availability={[
                    { day: "Monday", time: "10:00 AM - 12:00 PM" },
                    { day: "Wednesday", time: "2:00 PM - 4:00 PM" },
                    { day: "Friday", time: "9:00 AM - 11:00 AM" },
                  ]}
                  isOpen={isAvailabilityModalOpen}
                  onOpenChange={setAvailabilityModalOpen}
                  onSelect={handleSlotSelect}
                />
                <Button variant="outline" onClick={() => setCalendarModalOpen(true)}>
                  <Calendar className="h-4 w-4 mr-2" /> View Calendar
                </Button>
                <ViewCalendarModal 
                  schedule={schedule} 
                  isOpen={isCalendarModalOpen}
                  onOpenChange={setCalendarModalOpen}
                />
                <ViewCalendarModal schedule={schedule} />
              </div>

              <div className="space-y-4">
                {
                  (() => {
                    const now = new Date();
                    const upcomingAppointments = schedule
                      .map(appt => {
                        if (!appt.appointment_date || !appt.appointment_time) {
                          return { ...appt, combinedDateTime: null };
                        }
                        // Construct a date string in 'YYYY-MM-DDTHH:mm:ss.sss' format, which is parsed as local time
                        const dateStr = `${appt.appointment_date.substring(0, 10)}T${appt.appointment_time.substring(11, 23)}`;
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

                    if (upcomingAppointments.length > 0) {
                      return upcomingAppointments.map((appt) => (
                        <div key={appt.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">{appt.client.client_first_name} {appt.client.client_last_name}</h3>
                              <p className="text-sm text-gray-600">
                                {new Date(appt.appointment_date).toLocaleDateString(undefined, { timeZone: 'UTC' })} at {new Date(appt.combinedDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {appt.type} • {appt.duration}
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
                      ));
                    } else {
                      return (
                        <div className="text-center py-8 text-gray-500">
                          <p>No upcoming appointments scheduled for today.</p>
                          <p className="text-sm mt-1">Click "Add Appointment" to get started</p>
                        </div>
                      );
                    }
                  })()
                }
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
                  {supervisor && (
                    <VoiceCallModal user={user} supervisor={supervisor} onCallEnd={handleCallEnd} />
                  )}
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="date"
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateRange && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange?.from ? (
                            dateRange.to ? `${new Date(dateRange.from).toLocaleDateString()} - ${new Date(dateRange.to).toLocaleDateString()}` : new Date(dateRange.from).toLocaleDateString()
                          ) : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <Button className="w-full" onClick={generateReport} disabled={loading}>
                  {loading ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> Generating...</>
                  ) : (
                    <><BarChart3 className="h-4 w-4 mr-2" /> Generate Report</>
                  )}
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
                            if (report.type === 'PDF') {
                              const doc = new jsPDF();
                              doc.text(JSON.stringify(report.data, null, 2), 10, 10);
                              doc.save(`${report.name}.pdf`);
                            } else if (report.type === 'Excel') {
                              const worksheet = XLSX.utils.json_to_sheet(report.data.sessions);
                              const workbook = XLSX.utils.book_new();
                              XLSX.utils.book_append_sheet(workbook, worksheet, "Sessions");
                              XLSX.writeFile(workbook, `${report.name}.xlsx`);
                            } else {
                              alert(`Downloading ${report.type} files is not yet supported.`);
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

        <TabsContent value="Audit Log" className="space-y-6">
          <AuditLogTab
            auditLogs={auditLogs}
            currentUser={user}
          />
        </TabsContent>
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

  const normalizeRole = (r) => {
    if (!r) return null;
    // Convert any format to underscore: team-leader -> team_leader, teamLeader -> team_leader
    const splitCamel = r.replace(/([a-z])([A-Z])/g, "$1_$2");
    return splitCamel.toLowerCase().replace(/[-\s]/g, "_");
  };

  const normalized = normalizeRole(rawRole);
  const userRole = normalized ? normalized.replace(/_/g, "-") : "support-worker";
  const userName = user?.fullName ?? "User";

  return <InteractiveDashboardContent user={user} userRole={userRole} userName={userName} getToken={getToken} defaultTab={tab || 'Overview'} />;
}

export default function InteractiveDashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InteractiveDashboard />
    </Suspense>
  )
}
