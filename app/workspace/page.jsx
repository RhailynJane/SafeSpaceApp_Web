"use client";

import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import useDraggable from "../../hooks/useDraggable";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Clock, CheckCircle, XCircle, Info, Phone, Mail, MapPin, User, FileText, BarChart3, Search, MoreVertical } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

import { DashboardOverview } from "@/components/dashboard-overview";
import ClientActionButtons from "@/components/ClientActionButtons";
import ReferralActions from "@/components/ReferralActions";
import NewNoteModal from "@/components/Notes/NewNoteModal";
import ViewNoteModal from "@/components/Notes/ViewNoteModal";
import EditNoteModal from "@/components/Notes/EditNoteModal";
import DeleteNoteModal from "@/components/Notes/DeleteNoteModal";
import AddAppointmentModal from "@/components/schedule/AddAppointmentModal";
import ScheduleFilters from "@/components/schedule/ScheduleFilters";
import ViewCalendarModal from "@/components/schedule/ViewCalendarModal";
import ViewDetailsModal from "@/components/schedule/ViewDetailsModal";
import ViewReportModal from "@/components/reports/ViewReportModal";
import SendbirdChat from "@/components/SendbirdChat";

import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, ImageRun } from "docx";
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  ArcElement,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, ArcElement, BarElement, ChartTitle, Tooltip, Legend);
import AuditLogTab from "../auditlogtab/page";

import VoiceCallModal from "@/components/crisis/VoiceCallModal";

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
  const [selectedClientId, setSelectedClientId] = useState("");
  const [dateRange, setDateRange] = useState("month");
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().substring(0,10);
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().substring(0,10));
  const chartContainerRef = useRef(null);
  const [reportData, setReportData] = useState(null);
  const [reportValidationMsg, setReportValidationMsg] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  // Ensure user is initialized before queries (avoid name clashes)
  const isUserReady = typeof isLoaded !== 'undefined' && isLoaded && !!user;
  const dbUserRec = useQuery(api.users.getByClerkId, isUserReady ? { clerkId: user?.id } : 'skip') || null;
  const [recentCursor, setRecentCursor] = useState(null);
  const [cursorStack, setCursorStack] = useState([]);
  // Pagination state for Recent Reports
  const [recentFilterType, setRecentFilterType] = useState('all');
  const [recentStart, setRecentStart] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().substring(0,10);
  });
  const [recentEnd, setRecentEnd] = useState(() => new Date().toISOString().substring(0,10));
  // Now that recentStart/recentEnd exist, compute timestamps and query
  const startMs2 = recentStart ? new Date(recentStart + 'T00:00:00').getTime() : undefined;
  const endMs2 = recentEnd ? new Date(recentEnd + 'T23:59:59').getTime() : undefined;
  const recentResp = useQuery(
    api.reports.list,
    isUserReady
      ? {
          orgId: dbUserRec?.orgId,
          reportType: recentFilterType === 'all' ? undefined : recentFilterType,
          start: startMs2,
          end: endMs2,
          limit: 20,
          cursor: recentCursor,
        }
      : 'skip'
  );
  const recentReports = recentResp || []; // Convex query returns array directly, not paginated
  
  // Debug logging for recent reports
  useEffect(() => {
    console.log('📊 Recent Reports Debug:', {
      isUserReady,
      dbUserOrgId: dbUserRec?.orgId,
      recentFilterType,
      startMs2,
      endMs2,
      recentResp,
      recentReportsCount: recentReports?.length || 0
    });
  }, [isUserReady, dbUserRec?.orgId, recentFilterType, startMs2, endMs2, recentResp]);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskLevelFilter, setRiskLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showChat, setShowChat] = useState(false);
  const [channelUrl, setChannelUrl] = useState("");
  const [chatChannelName, setChatChannelName] = useState("Chat");
  
  // Get today's date in local timezone (YYYY-MM-DD)
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;
  
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [scheduleFilter, setScheduleFilter] = useState({ type: 'day', start: todayStr, end: todayStr });

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

      // Sync user to Convex to ensure they exist with proper orgId
      try {
        const syncRes = await fetch("/api/users/sync");
        if (syncRes.ok) {
          const syncData = await syncRes.json();
          console.log("User synced to Convex:", syncData);
        } else {
          console.warn("Failed to sync user to Convex");
        }
      } catch (syncError) {
        console.warn("User sync error:", syncError);
      }

      // Always fetch crisis events and audit logs (clients handled via Convex)
      const [crisisRes, auditRes] = await Promise.all([
        fetch("/api/crisis-events"),
        fetch("/api/audit-logs"),
      ]);

      if (crisisRes.ok) {
        const crisisData = await crisisRes.json();
        setCrisisEvents(Array.isArray(crisisData) ? crisisData : []);
      } else {
      }

      // Notes and appointments now loaded via Convex below

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
      }

    } catch (error) {
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [getToken, userRole]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load Convex data for clients, today's appointments, and my notes
  const isUserLoaded = Boolean(user?.id);
  const convexClients = useQuery(
    api.clients.list,
    isUserLoaded ? { clerkId: user.id } : 'skip'
  ) || [];
  const convexTodaysAppts = useQuery(
    api.appointments.listByDate,
    isUserLoaded ? { clerkId: user.id, date: selectedDate } : 'skip'
  ) || [];
  const convexAllAppts = useQuery(
    api.appointments.list,
    isUserLoaded && dbUser?.orgId ? { clerkId: user.id, orgId: dbUser.orgId } : 'skip'
  ) || [];
  const convexMyNotes = useQuery(
    api.notes.listForUser,
    isUserLoaded ? { clerkId: user.id } : 'skip'
  ) || [];

  // Map Convex data into the legacy UI shapes used in this view
  useEffect(() => {
    if (!convexClients) return;
    
    console.log("📋 Convex clients received:", convexClients);
    console.log("📊 Number of clients:", convexClients.length);
    
    // Map clients into legacy shape used in this view and modals - INCLUDING ALL FIELDS
    const mappedClients = convexClients.map((c) => ({
      id: String(c._id),
      org_id: c.orgId || "",
      orgId: c.orgId || "",
      client_first_name: c.firstName || "",
      client_last_name: c.lastName || "",
      email: c.email || "",
      phone: c.phone || "",
      address: c.address || "",
      status: (c.status || "active").replace(/^[a-z]/, (m) => m.toUpperCase()),
      risk_level: (c.riskLevel || "low").replace(/^[a-z]/, (m) => m.toUpperCase()),
      last_session_date: c.lastSessionDate ? new Date(c.lastSessionDate).toISOString() : new Date(c.createdAt).toISOString(),
      // Additional personal information
      age: c.age || "",
      date_of_birth: c.dateOfBirth || "",
      gender: c.gender || "",
      pronouns: c.pronouns || "",
      primary_language: c.primaryLanguage || "",
      // Clinical information
      mental_health_concerns: c.mentalHealthConcerns || "",
      support_needed: c.supportNeeded || "",
      ethnocultural_background: c.ethnoculturalBackground || "",
      // Emergency contact information
      emergency_contact_name: c.emergencyContactName || "",
      emergency_contact_phone: c.emergencyContactPhone || "",
      emergency_contact_relationship: c.emergencyContactRelationship || "",
      // Referral information (if any)
      referral_source: c.referralSource || "",
      reason_for_referral: c.reasonForReferral || "",
      additional_notes: c.additionalNotes || "",
    }));
    
    console.log("📋 Mapped clients with all fields:", mappedClients);
    
    // Only update if data actually changed
    setClients(prev => {
      if (JSON.stringify(prev) === JSON.stringify(mappedClients)) return prev;
      return mappedClients;
    });
  }, [convexClients]);

  useEffect(() => {
    if (!convexTodaysAppts || !convexClients) return;
    
    // Map appointments
    const appts = convexTodaysAppts.map((a) => {
      const found = convexClients.find(c => c._id === a.clientId);
      let first = "";
      let last = "";
      if (found) {
        first = found.firstName || "";
        last = found.lastName || "";
      } else if (a.clientName) {
        const parts = String(a.clientName).trim().split(" ");
        first = parts[0] || "";
        last = parts.slice(1).join(" ") || "";
      }
      return {
        id: a._id,
        _id: a._id,
        client_id: a.clientId,
        clientId: a.clientId,
        appointment_date: a.appointmentDate,
        appointment_time: a.appointmentTime || "",
        type: a.type || "",
        duration: a.duration ? `${a.duration} min` : "",
        details: a.notes || "",
        client: { client_first_name: first, client_last_name: last },
      };
    });
    
    // Merge with any optimistic items already in schedule for the selected date
    setSchedule(prev => {
      const prevForDate = prev.filter(p => p.appointment_date === selectedDate);
      const mergedForDate = [...appts, ...prevForDate].reduce((acc, item) => {
        const key = String(item.id || `${item.appointment_date}_${item.appointment_time}_${item.type}`);
        if (!acc.find(x => String(x.id || `${x.appointment_date}_${x.appointment_time}_${x.type}`) === key)) {
          acc.push(item);
        }
        return acc;
      }, []);
      const others = prev.filter(p => p.appointment_date !== selectedDate);
      const next = [...others, ...mergedForDate];
      if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
      return next;
    });
  }, [convexTodaysAppts, convexClients, selectedDate]);

  // Populate schedule with all appointments for ScheduleModal
  useEffect(() => {
    if (!convexAllAppts || !convexClients) return;
    
    // Map all appointments
    const allAppts = convexAllAppts.map((a) => {
      const found = convexClients.find(c => c._id === a.clientId);
      let first = "";
      let last = "";
      if (found) {
        first = found.firstName || "";
        last = found.lastName || "";
      } else if (a.clientName) {
        const parts = String(a.clientName).trim().split(" ");
        first = parts[0] || "";
        last = parts.slice(1).join(" ") || "";
      }
      return {
        id: a._id,
        _id: a._id,
        client_id: a.clientId,
        clientId: a.clientId,
        appointment_date: a.appointmentDate,
        appointment_time: a.appointmentTime || "",
        type: a.type || "",
        duration: a.duration ? `${a.duration} min` : "",
        details: a.notes || "",
        client: { client_first_name: first, client_last_name: last },
      };
    });
    
    // Merge with any optimistic items across all dates
    setSchedule(prev => {
      const merged = [...allAppts, ...prev].reduce((acc, item) => {
        const key = String(item.id || `${item.appointment_date}_${item.appointment_time}_${item.type}`);
        if (!acc.find(x => String(x.id || `${x.appointment_date}_${x.appointment_time}_${x.type}`) === key)) {
          acc.push(item);
        }
        return acc;
      }, []);
      if (JSON.stringify(prev) === JSON.stringify(merged)) return prev;
      return merged;
    });
  }, [convexAllAppts, convexClients]);

  useEffect(() => {
    if (!convexMyNotes || !convexClients) return;
    
    // Map notes
    const mappedNotes = convexMyNotes.map((n) => {
      const found = convexClients.find(c => c._id === n.clientId);
      
      // Enhanced author resolution with multiple matching strategies
      let authorUser = null;
      if (assignableUsers && assignableUsers.length > 0) {
        // Try multiple matching strategies
        authorUser = assignableUsers.find(u => 
          u.clerkId === n.authorUserId || 
          u._id === n.authorUserId ||
          u.id === n.authorUserId
        );
        
        // If still not found, try case-insensitive email match
        if (!authorUser && n.authorUserId && n.authorUserId.includes('@')) {
          authorUser = assignableUsers.find(u => 
            u.email && u.email.toLowerCase() === n.authorUserId.toLowerCase()
          );
        }
      }
      
      // Debug logging for troubleshooting
      if (!authorUser && n.authorUserId) {
        console.log('🔍 Author not found for note:', {
          noteId: n._id,
          authorUserId: n.authorUserId,
          availableUsers: assignableUsers?.map(u => ({ id: u._id, clerkId: u.clerkId, email: u.email, name: `${u.firstName || u.first_name} ${u.lastName || u.last_name}` }))
        });
      }
      
      return {
        id: n._id,
        client: {
          client_first_name: found?.firstName || "",
          client_last_name: found?.lastName || "",
        },
        session_type: n.sessionType || "",
        note_date: n.noteDate || "",
        duration_minutes: n.durationMinutes || null,
        summary: n.summary || "",
        detailed_notes: n.detailedNotes || "",
        risk_assessment: n.riskAssessment || "",
        next_steps: n.nextSteps || "",
        activities: n.activities || [],
        // Author information for reports
        author_user_id: n.authorUserId,
        author_name: authorUser ? 
          `${authorUser.firstName || authorUser.first_name || ''} ${authorUser.lastName || authorUser.last_name || ''}`.trim() :
          (n.authorUserId ? `User (${n.authorUserId.substring(0, 8)}...)` : 'Unknown Author'),
      };
    });
    
    // Only update if data actually changed
    setNotes(prev => {
      if (JSON.stringify(prev) === JSON.stringify(mappedNotes)) return prev;
      return mappedNotes;
    });
  }, [convexMyNotes, convexClients]);

  const handleAddAppointment = (newAppointment) => {
    // Optimistically add in legacy shape; Convex query will refresh shortly
    const optim = {
      id: newAppointment._id || newAppointment.id || Math.random().toString(36).slice(2),
      _id: newAppointment._id || newAppointment.id,
      client_id: newAppointment.clientId || newAppointment.client_id,
      clientId: newAppointment.clientId || newAppointment.client_id,
      appointment_date: newAppointment.appointmentDate || newAppointment.appointment_date || todayStr,
      appointment_time: newAppointment.appointmentTime || newAppointment.appointment_time || "",
      type: newAppointment.type || "",
      duration: typeof newAppointment.duration === 'number' ? `${newAppointment.duration} min` : (newAppointment.duration || ""),
      details: newAppointment.details || newAppointment.notes || "",
      client: newAppointment.client || { 
        client_first_name: newAppointment.client?.client_first_name || "", 
        client_last_name: newAppointment.client?.client_last_name || "" 
      },
    };
    setSchedule((prev) => [...prev, optim]);
    // Ensure the schedule view switches to the newly added appointment's date
    if (optim.appointment_date && optim.appointment_date !== selectedDate) {
      setSelectedDate(optim.appointment_date);
    }
    mutate("/api/dashboard");
  };
  const handleDeleteAppointment = (id) => setSchedule(prev => prev.filter(a => a.id !== id));

  const handleReferralStatusUpdate = (referralId, updatedReferral) => {
    setReferrals(prev =>
      prev.map(r => (r._id === referralId ? updatedReferral : r))
    );
  };

  // Convex: notes mutations
  const createNote = useMutation(api.notes.create);
  const updateNoteMut = useMutation(api.notes.update);
  const removeNote = useMutation(api.notes.remove);

  const handleCreateNote = async (noteData) => {
    try {
      await createNote({
        clerkId: user.id,
        clientId: String(noteData.client_id),
        authorUserId: noteData.author_id, // Use selected staff member as author
        noteDate: noteData.note_date,
        sessionType: noteData.session_type,
        durationMinutes: noteData.duration_minutes ? parseInt(noteData.duration_minutes, 10) : undefined,
        summary: noteData.summary,
        detailedNotes: noteData.detailed_notes,
        riskAssessment: noteData.risk_assessment,
        nextSteps: noteData.next_steps,
        activities: noteData.activities || [],
      });
      closeModal('newNote');
    } catch (error) {
    }
  };

  const handleUpdateNote = async (noteData) => {
    try {
      await updateNoteMut({
        clerkId: user.id,
        noteId: noteData.id,
        noteDate: noteData.note_date,
        sessionType: noteData.session_type,
        durationMinutes: noteData.duration_minutes ? parseInt(noteData.duration_minutes, 10) : undefined,
        summary: noteData.summary,
        detailedNotes: noteData.detailed_notes,
        riskAssessment: noteData.risk_assessment,
        nextSteps: noteData.next_steps,
        activities: noteData.activities || [],
      });
      closeModal('editNote');
    } catch (error) {
    }
  };

  const tabs = userRole === "team-leader"
    ? ["Overview", "Referrals", "Clients", "Schedule", "Notes", "Crisis", "Reports", "Audit Log"]
    : ["Overview", "Clients", "Schedule", "Notes", "Crisis", "Reports"];

  const [modals, setModals] = useState({
    newNote: false,
    viewNote: false,
    editNote: false,
    deleteNote: false,
  });
  const [selectedNote, setSelectedNote] = useState(null);

  const openModal = (modalName, item = null) => {
    setSelectedNote(item);
    setModals(prev => ({ ...prev, [modalName]: true }));
  };
  const closeModal = (modalName) => setModals(prev => ({ ...prev, [modalName]: false }));

  const handleDeleteNote = async (noteId) => {
    openModal('deleteNote', { _id: noteId });
  };

  const confirmDeleteNote = async () => {
    if (!selectedNote?._id) return;
    try {
      await removeNote({ clerkId: user.id, noteId: selectedNote._id });
      closeModal('deleteNote');
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const computeDateBounds = () => {
    const end = new Date();
    const start = new Date();
    if (dateRange === 'week') start.setDate(end.getDate() - 7);
    else if (dateRange === 'month') start.setDate(end.getDate() - 30);
    else if (dateRange === 'quarter') start.setDate(end.getDate() - 90);
    else if (dateRange === 'year') start.setDate(end.getDate() - 365);
    else if (dateRange === 'custom') {
      return { start: new Date(customStart + 'T00:00:00'), end: new Date(customEnd + 'T23:59:59') };
    }
    return { start, end };
  };

  const createReport = useMutation(api.reports.create);

  const generateReport = async () => {
    const { start, end } = computeDateBounds();
    const withinRange = (dateStr) => {
      if (!dateStr) return false;
      const d = new Date(dateStr.substring(0,10) + 'T00:00:00');
      return d >= start && d <= end;
    };

    // Inline validation: keep button clickable and show message
    if (reportType === 'client-summary' && !selectedClientId) {
      setReportValidationMsg('Please select a client to generate this report.');
      return;
    } else {
      setReportValidationMsg('');
    }

    // Normalize report types: outcomes and crisis -> interventions
    const normalizedType = (reportType === 'outcomes' || reportType === 'crisis') ? 'interventions' : reportType;

    if (normalizedType === "caseload") {
      setReportData({
        totalClients: clients.length,
        activeClients: clients.filter(c => c.status === "Active").length,
        onHoldClients: clients.filter(c => c.status !== "Active").length,
        rangeStart: start.toISOString().substring(0,10),
        rangeEnd: end.toISOString().substring(0,10)
      });
    } else if (normalizedType === "sessions") {
      const filteredSessions = schedule.filter(s => withinRange(s.appointment_date || s.appointmentDate));
      const filteredNotes = notes.filter(n => withinRange(n.note_date));
      
      // Sessions Summary: Aggregate by support worker
      const bySupportWorker = {};
      filteredNotes.forEach(n => {
        // Enhanced support worker name resolution
        let workerName = 'Unknown Worker';
        
        if (n.author_name && n.author_name !== 'Unknown Author' && !n.author_name.startsWith('User (')) {
          // Use the properly resolved author_name
          workerName = n.author_name;
        } else if (n.author_user_id && assignableUsers) {
          // Try to resolve name directly from assignableUsers if author_name failed
          const worker = assignableUsers.find(u => 
            u.clerkId === n.author_user_id || u._id === n.author_user_id || u.id === n.author_user_id
          );
          if (worker) {
            workerName = `${worker.firstName || worker.first_name || ''} ${worker.lastName || worker.last_name || ''}`.trim();
          } else if (n.author_user_id) {
            workerName = `Unknown Staff (${n.author_user_id.substring(0, 8)}...)`;
          }
        }
        
        if (!bySupportWorker[workerName]) {
          bySupportWorker[workerName] = { total: 0 };
        }
        const activity = n.session_type || 'General';
        const minutes = n.duration_minutes || 30;
        bySupportWorker[workerName][activity] = (bySupportWorker[workerName][activity] || 0) + minutes;
        bySupportWorker[workerName].total += minutes;
      });
      
      setReportData({
        totalSessions: filteredSessions.length,
        totalMinutes: filteredNotes.reduce((acc, n) => acc + (n.duration_minutes || 30), 0),
        averageSessionLength: 30,
        // Detailed views
        byClient: filteredNotes.reduce((acc, n) => {
          // Use client name from the mapped note data
          const clientName = n.client ? 
            `${n.client.client_first_name} ${n.client.client_last_name}`.trim() : 
            'Unknown Client';
          acc[clientName] = (acc[clientName] || 0) + 1;
          return acc;
        }, {}),
        byActivity: filteredNotes.reduce((acc, n) => {
          // Aggregate actual activities with minutes from note.activities array
          if (n.activities && Array.isArray(n.activities)) {
            n.activities.forEach(activity => {
              const activityType = activity.type || 'General';
              const minutes = parseInt(activity.minutes) || 0;
              acc[activityType] = (acc[activityType] || 0) + minutes;
            });
          } else {
            // Fallback: use session_type if no activities array
            const fallbackActivity = n.session_type || 'General Session';
            const fallbackMinutes = n.duration_minutes || 30;
            acc[fallbackActivity] = (acc[fallbackActivity] || 0) + fallbackMinutes;
          }
          return acc;
        }, {}),
        // Summary view (new)
        bySupportWorker,
        rangeStart: start.toISOString().substring(0,10),
        rangeEnd: end.toISOString().substring(0,10)
      });
    } else if (normalizedType === "interventions") {
      const filteredCrisis = referrals.filter(r => r.priority === "High" && r.status === "pending" && withinRange(r.created_at || r.date));
      setReportData({
        // Outcomes metrics
        completedAssessments: notes.filter(n => withinRange(n.note_date)).length,
        improvementRate: 78,
        goalAchievementRate: 65,
        clientSatisfactionScore: 4.2,
        // Crisis metrics
        totalCrisisEvents: filteredCrisis.length,
        averageResponseTime: '4.2 minutes',
        resolutionRate: 92,
        followUpRequired: Math.ceil(filteredCrisis.length * 0.25),
        // Combined intervention categories
        byCategory: {
          'Counseling Outcomes': notes.filter(n => withinRange(n.note_date) && n.session_type === 'individual').length,
          'Assessment Completions': notes.filter(n => withinRange(n.note_date) && n.session_type === 'assessment').length,
          'Goal Achievements': Math.floor(clients.filter(c => c.riskLevel === 'low').length * 0.6),
          'Crisis De-escalations': Math.floor(filteredCrisis.length * 0.75),
          'Hotline Interventions': Math.floor(filteredCrisis.length * 0.6),
          'Emergency Responses': Math.floor(filteredCrisis.length * 0.25),
          'Follow-up Actions': Math.floor(filteredCrisis.length * 0.67)
        },
        rangeStart: start.toISOString().substring(0,10),
        rangeEnd: end.toISOString().substring(0,10)
      });
    } else if (reportType === 'client-summary') {
      const client = clients.find(c => String(c.id || c._id) === String(selectedClientId));
      const clientNotes = notes.filter(n => {
        const fullName = `${client?.client_first_name} ${client?.client_last_name}`.trim();
        const nName = `${n.client.client_first_name} ${n.client.client_last_name}`.trim();
        return nName === fullName && withinRange(n.note_date);
      });
      const clientSessions = schedule.filter(s => {
        const idMatch = String(s.client_id || s.clientId) === String(selectedClientId);
        return idMatch && withinRange(s.appointment_date || s.appointmentDate);
      });
      const totalMinutes = clientNotes.reduce((acc, n) => acc + (n.duration_minutes || 0), 0);
      setReportData({
        clientName: `${client?.client_first_name} ${client?.client_last_name}`,
        sessionsCount: clientSessions.length,
        notesCount: clientNotes.length,
        totalMinutes,
        rangeStart: start.toISOString().substring(0,10),
        rangeEnd: end.toISOString().substring(0,10)
      });
    }

    // Persist to Convex with JSON + optional chart snapshot
    setTimeout(async () => {
      try {
        const dataJson = normalizedType === 'client-summary' || normalizedType === 'caseload' || normalizedType === 'sessions' || normalizedType === 'interventions'
          ? reportData
          : undefined;

        const reportPayload = {
          reportType: normalizedType,
          title: `${normalizedType.replace('-', ' ')} (${new Date().toLocaleDateString()})`,
          dataJson,
          orgId: dbUser?.orgId,
          createdBy: user.id,
        };
        console.log('Creating report with payload:', reportPayload);
        const reportId = await createReport(reportPayload);
        console.log('Report created with ID:', reportId);
      } catch (e) {
        console.warn('Failed to persist report:', e);
      }
    }, 0);
  };

  const exportPDF = () => {
    if (!reportData) return;
    // Formal layout settings
    const margin = { top: 20, left: 20, right: 20, bottom: 20 };
    const lineHeight = 6;
    const pageWidth = 210; // A4 width mm
    const contentWidth = pageWidth - margin.left - margin.right;

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    const addFooter = (pageNumber) => {
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(`Page ${pageNumber}`, pageWidth - margin.right, 287, { align: 'right' });
    };

    // Header
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('SafeSpace – Analytical Report', margin.left, margin.top);
    doc.setFontSize(12);
    const subtitle = `${reportType.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}`;
    doc.text(subtitle, margin.left, margin.top + 8);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin.left, margin.top + 14);

    // Section: Parameters
    let y = margin.top + 24;
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text('Parameters', margin.left, y); y += lineHeight;
    doc.setFontSize(10);
    doc.setTextColor(60);
    const params = [
      [`Date Range`, `${reportData.rangeStart} to ${reportData.rangeEnd}`],
      [`Report Type`, subtitle],
    ];
    params.forEach(([k, v]) => {
      doc.text(`${k}: ${v}`, margin.left, y); y += lineHeight;
    });

    // Section: Summary Metrics (tabular style)
    y += 4;
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text('Summary Metrics', margin.left, y); y += lineHeight;
    doc.setFontSize(10);
    doc.setTextColor(20);
    const rows = [];
    Object.entries(reportData).forEach(([k, v]) => {
      if (k === 'rangeStart' || k === 'rangeEnd') return;
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        rows.push([k, '']);
        Object.entries(v).forEach(([sk, sv]) => rows.push([`  ${sk}`, String(sv)]));
      } else {
        rows.push([k, String(v)]);
      }
    });
    // Draw rows with simple two-column layout
    const col1Width = Math.min(80, contentWidth * 0.45);
    const col2X = margin.left + col1Width + 4;
    rows.forEach(([k, v]) => {
      // Page break if needed
      if (y > 260) {
        addFooter(doc.getNumberOfPages());
        doc.addPage();
        y = margin.top;
      }
      doc.setTextColor(k.startsWith('  ') ? 80 : 0);
      doc.text(k, margin.left, y);
      doc.setTextColor(60);
      if (v) doc.text(v, col2X, y);
      y += lineHeight;
    });

    // Section: Charts (new page for clarity)
    const canvases = chartContainerRef.current?.querySelectorAll('canvas') || [];
    if (canvases.length > 0) {
      addFooter(doc.getNumberOfPages());
      doc.addPage();
      y = margin.top;
      doc.setTextColor(0);
      doc.setFontSize(12);
      doc.text('Visualizations', margin.left, y); y += lineHeight + 2;
      
      canvases.forEach((canvas, index) => {
        // Add page break if needed for additional charts
        if (index > 0 && y > 200) {
          addFooter(doc.getNumberOfPages());
          doc.addPage();
          y = margin.top;
        }
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = contentWidth;
        const imgHeight = (imgWidth * 9) / 16; // maintain aspect ratio
        
        // Check if chart fits on current page
        if (y + imgHeight > 260) {
          addFooter(doc.getNumberOfPages());
          doc.addPage();
          y = margin.top;
        }
        
        doc.addImage(imgData, 'PNG', margin.left, y, imgWidth, imgHeight);
        y += imgHeight + 6;
        doc.setFontSize(9);
        doc.setTextColor(120);
        doc.text(`Figure ${index + 1}: Chart visualization ${index + 1}.`, margin.left, y);
        y += 8; // Space between charts
      });
    }

    addFooter(doc.getNumberOfPages());
    doc.save(`SafeSpace-${reportType}-report.pdf`);
  };

  const exportExcel = () => {
    if (!reportData) return;
    const wb = XLSX.utils.book_new();
    
    // Main summary sheet
    const flat = [];
    Object.entries(reportData).forEach(([k,v]) => {
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        Object.entries(v).forEach(([sk, sv]) => flat.push({ key: `${k}.${sk}`, value: sv }));
      } else {
        flat.push({ key: k, value: v });
      }
    });
    const ws = XLSX.utils.json_to_sheet(flat);
    XLSX.utils.book_append_sheet(wb, ws, 'Summary');
    
    // For Sessions report, add separate sheets for each data breakdown
    if (reportType === 'sessions' && reportData.bySupportWorker) {
      // Support Worker breakdown sheet
      const workerData = [];
      Object.entries(reportData.bySupportWorker).forEach(([worker, activities]) => {
        Object.entries(activities).forEach(([activity, minutes]) => {
          workerData.push({ Worker: worker, Activity: activity, Minutes: minutes });
        });
      });
      const workerWS = XLSX.utils.json_to_sheet(workerData);
      XLSX.utils.book_append_sheet(wb, workerWS, 'Support Workers');
      
      // Client breakdown sheet
      if (reportData.byClient) {
        const clientData = Object.entries(reportData.byClient).map(([client, sessions]) => ({
          Client: client, Sessions: sessions
        }));
        const clientWS = XLSX.utils.json_to_sheet(clientData);
        XLSX.utils.book_append_sheet(wb, clientWS, 'By Client');
      }
      
      // Activity breakdown sheet
      if (reportData.byActivity) {
        const activityData = Object.entries(reportData.byActivity).map(([activity, minutes]) => ({
          Activity: activity, Minutes: minutes
        }));
        const activityWS = XLSX.utils.json_to_sheet(activityData);
        XLSX.utils.book_append_sheet(wb, activityWS, 'By Activity');
      }
    }
    
    XLSX.writeFile(wb, `report-${reportType}.xlsx`);
  };

  const exportWord = async () => {
    if (!reportData) return;
    const title = 'SafeSpace – Analytical Report';
    const subtitle = `${reportType.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}`;
    const generated = `Generated: ${new Date().toLocaleString()}`;

    // Cover page
    const cover = [
      new Paragraph({ text: title, heading: HeadingLevel.TITLE }),
      new Paragraph({ text: subtitle, heading: HeadingLevel.HEADING_2 }),
      new Paragraph({ text: generated }),
      new Paragraph({ text: `Date Range: ${reportData.rangeStart} to ${reportData.rangeEnd}` }),
    ];

    // Summary Metrics table (two-column)
    const rows = [];
    Object.entries(reportData).forEach(([k, v]) => {
      if (k === 'rangeStart' || k === 'rangeEnd') return;
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        rows.push(new TableRow({ children: [
          new TableCell({ children: [new Paragraph({ text: k })] }),
          new TableCell({ children: [new Paragraph({ text: '' })] }),
        ]}));
        Object.entries(v).forEach(([sk, sv]) => {
          rows.push(new TableRow({ children: [
            new TableCell({ children: [new Paragraph({ text: `  ${sk}` })] }),
            new TableCell({ children: [new Paragraph({ text: String(sv) })] }),
          ]}));
        });
      } else {
        rows.push(new TableRow({ children: [
          new TableCell({ children: [new Paragraph({ text: k })] }),
          new TableCell({ children: [new Paragraph({ text: String(v) })] }),
        ]}));
      }
    });
    const table = new Table({
      rows,
      width: { size: 100, type: WidthType.PERCENTAGE },
    });

    // Visualizations with embedded chart images when available
    const viz = [new Paragraph({ text: 'Visualizations', heading: HeadingLevel.HEADING_2 })];
    const canvases = chartContainerRef.current?.querySelectorAll('canvas') || [];
    if (canvases.length > 0) {
      canvases.forEach((canvas, index) => {
        try {
          // Convert canvas directly to buffer without fetch
          const dataUrl = canvas.toDataURL('image/png');
          const base64Data = dataUrl.split(',')[1];
          const arrayBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)).buffer;
          viz.push(new Paragraph({ children: [
            new ImageRun({ data: arrayBuffer, transformation: { width: 640, height: 360 } })
          ] }));
          viz.push(new Paragraph({ text: `Figure ${index + 1}: Chart visualization ${index + 1} for the selected report.` }));
          if (index < canvases.length - 1) {
            viz.push(new Paragraph({ text: '' })); // Space between charts
          }
        } catch (e) {
          console.warn(`Chart ${index + 1} embedding failed:`, e);
          viz.push(new Paragraph({ text: `Figure ${index + 1}: Chart visualization (embedding failed).` }));
        }
      });
    } else {
      viz.push(new Paragraph({ text: 'Figure 1: Chart visualization (no charts available).' }));
    }

    const docx = new Document({
      sections: [
        { properties: {}, children: cover },
        { properties: {}, children: [new Paragraph({ text: 'Summary Metrics', heading: HeadingLevel.HEADING_2 }), table] },
        { properties: {}, children: viz },
      ],
    });

    const blob = await Packer.toBlob(docx);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SafeSpace-${reportType}-report.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reopenReferral = async (id) => {
    setReferrals(prev => prev.map(r => r._id === id ? { ...r, status: "pending" } : r));
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

    console.log('Opening chat with:', { 
      currentUser: user.id, 
      otherUserId, 
      channelUrl,
      name: dynamicChannelName 
    });

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
      console.error('Sendbird error:', errorData);
      alert(`Failed to create chat channel: ${errorData.error || 'Unknown error'}`);
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
      

      {/* Header - Removed since it's now in WorkspaceGreeting */}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Tab Content based on URL param - No TabsList needed */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {defaultTab === "Overview" && (
          <div className="space-y-6">
            <DashboardOverview userRole={userRole} />
          </div>
        )}

        {/* Referrals Tab - Team Leaders Only */}
        {defaultTab === "Referrals" && userRole === "team-leader" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Referral Management</h2>
              <Badge variant="outline">{referrals.filter(r => r.status && ['pending', 'in-review', 'info-requested'].includes(r.status.toLowerCase())).length} Pending</Badge>
            </div>

            <Tabs defaultValue="pending" className="space-y-4">
              <TabsList className="bg-muted">
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="processed">Processed</TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-card-foreground">Pending Referrals</CardTitle>
                    <CardDescription>Review and process new client referrals</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {referrals.filter(r => r.status && ['pending', 'in-review', 'info-requested'].includes(r.status.toLowerCase())).map(referral => (
                      <div key={referral._id} className="border border-border bg-card rounded-lg p-4 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg text-foreground">{referral.client_first_name} {referral.client_last_name}</h3>
                              {referral.status.toLowerCase() === 'info-requested' && (
                                <Badge variant="outline" className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700">
                                  <Info className="h-3 w-3 mr-1" />
                                  Info Requested
                                </Badge>
                              )}
                              {referral.status.toLowerCase() === 'in-review' && (
                                <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700">
                                  In Review
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                              <div>Age: {referral.age}</div>
                              <div>Source: {referral.referral_source}</div>
                              <div>Submitted: {new Date(referral.submitted_date).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-foreground">Reason for Referral:</h4>
                          <p className="text-sm text-muted-foreground">{referral.reason_for_referral}</p>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-foreground">Contact Information:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
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
                            <h4 className="font-medium text-foreground">Additional Notes:</h4>
                            <p className="text-sm text-muted-foreground bg-muted p-3 rounded">{referral.additional_notes}</p>
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

                    {referrals.filter(r => r.status && ['pending', 'in-review', 'info-requested'].includes(r.status.toLowerCase())).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="mx-auto h-16 w-16 mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2 text-foreground">No pending referrals</h3>
                        <p className="text-sm">All referrals have been processed.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="processed">
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-card-foreground">Processed Referrals</CardTitle>
                    <CardDescription>Referrals that have been accepted, declined, or are in progress.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {referrals.filter(r => r.status && ['accepted', 'declined'].includes(r.status.toLowerCase())).map(referral => (
                      <div key={referral._id} className="border border-border rounded-lg p-4 space-y-2 bg-card">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg text-foreground">{referral.client_first_name} {referral.client_last_name}</h3>
                          <Badge className={
                            referral.status.toLowerCase() === "accepted"
                              ? "bg-teal-600 dark:bg-teal-700 text-white"
                              : referral.status.toLowerCase() === "declined"
                                ? "bg-red-500 dark:bg-red-600 text-white"
                                : "bg-blue-500 dark:bg-blue-600 text-white"
                          }>
                            {referral.status}
                          </Badge>

                        </div>
                        <div className="text-sm text-muted-foreground">
                          Processed on: {new Date(referral.processed_date || referral.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                    {referrals.filter(r => r.status && ['accepted', 'declined'].includes(r.status.toLowerCase())).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="mx-auto h-16 w-16 mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2 text-foreground">No processed referrals</h3>
                        <p className="text-sm">Process a referral from the 'Pending' tab.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Clients Tab */}
        {defaultTab === "Clients" && (
          <div className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-card-foreground">Client Management</CardTitle>
              <CardDescription>Manage your active clients and their information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4 mb-4">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search clients by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 bg-background border-input"
                  />
                </div>
                <Select value={riskLevelFilter} onValueChange={setRiskLevelFilter}>
                  <SelectTrigger className="w-[180px] bg-background border-input">
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
                        <ClientActionButtons 
                          client={client} 
                          onMessage={() => openChat(client)} 
                          schedule={schedule}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
          </div>
        )}

        {/* Schedule Tab */}
        {defaultTab === "Schedule" && (
          <div className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="text-card-foreground">Schedule</CardTitle>
                  <CardDescription>Your appointments for the selected date</CardDescription>
                </div>
                <ScheduleFilters 
                  selectedDate={selectedDate} 
                  onDateChange={setSelectedDate}
                  onFilterChange={setScheduleFilter}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <AddAppointmentModal onAdd={handleAddAppointment} defaultDate={selectedDate} clients={clients} existingAppointments={schedule} />
                <ViewCalendarModal schedule={schedule} />
              </div>

              <div className="space-y-4">
                {(() => {
                  const items = schedule
                    .filter((appt) => {
                      // Filter appointments based on the selected date range
                      if (!appt.appointment_date) return false;
                      const apptDate = appt.appointment_date.substring(0, 10);
                      
                      if (scheduleFilter.type === 'day') {
                        return apptDate === scheduleFilter.start;
                      } else if (scheduleFilter.type === 'week' || scheduleFilter.type === 'month' || scheduleFilter.type === 'custom') {
                        return apptDate >= scheduleFilter.start && apptDate <= scheduleFilter.end;
                      }
                      return true;
                    })
                    .map((appt) => {
                      if (!appt.appointment_date || !appt.appointment_time) return { ...appt, combinedDateTime: null };
                      // Combine local date and time for consistent sorting/display
                      const dateStr = `${appt.appointment_date.substring(0, 10)}T${appt.appointment_time.substring(0,5)}`;
                      const combinedDateTime = new Date(dateStr);
                      return { ...appt, combinedDateTime };
                    })
                    .sort((a, b) => {
                      if (!a.combinedDateTime) return 1;
                      if (!b.combinedDateTime) return -1;
                      return a.combinedDateTime.getTime() - b.combinedDateTime.getTime();
                    });

                  if (items.length > 0) {
                    return items.map((appt) => (
                      <div key={appt.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{appt.client.client_first_name} {appt.client.client_last_name}</h3>
                            <p className="text-sm text-gray-600">
                              {appt.appointment_date} at {appt.appointment_time} • {appt.type} • {appt.duration}
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
                  }
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <p>No appointments for this {scheduleFilter.type === 'day' ? 'date' : scheduleFilter.type}.</p>
                      <p className="text-sm mt-1">Click "Add Appointment" to get started</p>
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {/* Notes Tab */}
        {defaultTab === "Notes" && (
          <div className="space-y-6">
            <NewNoteModal
              isOpen={modals.newNote}
              onClose={() => closeModal('newNote')}
              clients={clients}
              assignableUsers={assignableUsers}
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

          <DeleteNoteModal
            isOpen={modals.deleteNote}
            onClose={() => closeModal('deleteNote')}
            onConfirm={confirmDeleteNote}
            noteSummary={selectedNote?.summary}
          />

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-card-foreground">Session Notes</CardTitle>
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
                  <div key={note.id} className="border border-border rounded-lg p-4 bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-card-foreground">{note.client.client_first_name} {note.client.client_last_name}</h4>
                      <span className="text-sm text-muted-foreground">{new Date(note.note_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-4 mb-2">
                      <p className="text-sm text-muted-foreground">{note.session_type}</p>
                      <p className="text-sm text-muted-foreground">• Created by {note.author_name || 'Unknown'}</p>
                    </div>
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
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="mx-auto h-16 w-16 mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2 text-foreground">No notes found</h3>
                    <p className="text-sm">Click "New Note" to create one.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          </div>
        )}

        {/* Crisis Events Tab */}
        {defaultTab === "Crisis" && (
          <div className="space-y-6">
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
          </div>
        )}

        {/* Reports Tab */}
        {defaultTab === "Reports" && (
          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-card-foreground">Generate Reports</CardTitle>
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
                        <SelectItem value="client-summary">Client Report Summary</SelectItem>
                        <SelectItem value="caseload">Caseload Summary</SelectItem>
                        <SelectItem value="sessions">Session Reports</SelectItem>
                        <SelectItem value="interventions">Interventions</SelectItem>
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
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                    {reportType === 'client-summary' && (
                      <div className="space-y-2 pt-2">
                        <Label>Client</Label>
                        <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select client" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map(c => (
                              <SelectItem key={c.id || c._id} value={String(c.id || c._id)}>
                                {c.client_first_name} {c.client_last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {dateRange === 'custom' && (
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Start</Label>
                          <Input type="date" value={customStart} max={customEnd} onChange={e => setCustomStart(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">End</Label>
                          <Input type="date" value={customEnd} min={customStart} onChange={e => setCustomEnd(e.target.value)} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={generateReport}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                {reportValidationMsg && (
                  <div className="mt-2 text-sm text-red-600">{reportValidationMsg}</div>
                )}

                {reportData && (
                  <div className="mt-4 p-4 border border-border rounded-lg bg-muted space-y-4" ref={chartContainerRef}>
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground">Report Generated</h4>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={exportPDF}>PDF</Button>
                        <Button variant="outline" size="sm" onClick={exportExcel}>Excel</Button>
                        <Button variant="outline" size="sm" onClick={exportWord}>Word</Button>
                      </div>
                    </div>
                    <pre className="text-xs text-muted-foreground max-h-40 overflow-y-auto bg-background/40 p-2 rounded">
                      {JSON.stringify(reportData, null, 2)}
                    </pre>
                    {/* Chart Visualization */}
                    {reportType === 'caseload' && (
                      <Bar 
                        data={{
                          labels: ['Total', 'Active', 'On Hold', 'Assigned (SW)', 'Assigned (TL)'],
                          datasets: [{
                            label: 'Clients',
                            data: [reportData.totalClients, reportData.activeClients, reportData.onHoldClients, reportData.assignedToSupportWorkers || 0, reportData.assignedToTeamLeaders || 0],
                            backgroundColor: ['#4f46e5', '#16a34a', '#f59e0b', '#06b6d4', '#a855f7'],
                          }]
                        }}
                        options={{ responsive: true, plugins: { legend: { position: 'bottom' }}}}
                      />
                    )}
                    {reportType === 'outcomes' && (
                      <Pie 
                        data={{
                          labels: ['High Risk', 'Medium Risk', 'Low Risk'],
                          datasets: [{
                            label: 'Risk Levels',
                            data: [reportData.highRisk, reportData.mediumRisk, reportData.lowRisk],
                            backgroundColor: ['#dc2626', '#f59e0b', '#16a34a'],
                          }]
                        }}
                        options={{ responsive: true, plugins: { legend: { position: 'bottom' }}}}
                      />
                    )}
                    {reportType === 'sessions' && reportData && (
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-medium mb-3">Summary by Support Worker</h4>
                          <Bar
                            data={{
                              labels: Object.keys(reportData.bySupportWorker || {}),
                              datasets: [{
                                label: 'Total Minutes',
                                data: Object.keys(reportData.bySupportWorker || {}).map(worker => 
                                  reportData.bySupportWorker[worker]?.total || 0
                                ),
                                backgroundColor: '#8b5cf6'
                              }]
                            }}
                            options={{ responsive: true, plugins: { legend: { position: 'bottom' }}}}
                          />
                        </div>
                        <div>
                          <h4 className="font-medium mb-3">Detailed by Client</h4>
                          <Bar
                            data={{
                              labels: Object.keys(reportData.byClient || {}),
                              datasets: [{
                                label: 'Sessions per Client',
                                data: Object.values(reportData.byClient || {}),
                                backgroundColor: '#4f46e5'
                              }]
                            }}
                            options={{ responsive: true, plugins: { legend: { position: 'bottom' }}}}
                          />
                        </div>
                        <div>
                          <h4 className="font-medium mb-3">Activity Log (Minutes)</h4>
                          <Bar
                            data={{
                              labels: Object.keys(reportData.byActivity || {}),
                              datasets: [{
                                label: 'Minutes by Activity Type',
                                data: Object.values(reportData.byActivity || {}),
                                backgroundColor: '#16a34a'
                              }]
                            }}
                            options={{ 
                              responsive: true, 
                              plugins: { legend: { position: 'bottom' }},
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  title: {
                                    display: true,
                                    text: 'Minutes'
                                  }
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                    )}
                    {reportType === 'interventions' && reportData && (
                      <Bar
                        data={{
                          labels: Object.keys(reportData.byCategory || {}),
                          datasets: [{
                            label: 'Interventions by Category',
                            data: Object.values(reportData.byCategory || {}),
                            backgroundColor: '#f59e0b'
                          }]
                        }}
                        options={{ responsive: true, plugins: { legend: { position: 'bottom' }}}}
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Reports - fetched from Convex */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-card-foreground">Recent Reports</CardTitle>
                <CardDescription>Latest generated reports (stored in Convex)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Filter by Type</Label>
                    <Select value={recentFilterType} onValueChange={setRecentFilterType}>
                      <SelectTrigger><SelectValue placeholder="All types" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="client-summary">Client Summary</SelectItem>
                        <SelectItem value="caseload">Caseload</SelectItem>
                        <SelectItem value="sessions">Sessions</SelectItem>
                        <SelectItem value="interventions">Interventions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Start</Label>
                    <Input type="date" value={recentStart} max={recentEnd} onChange={e => setRecentStart(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">End</Label>
                    <Input type="date" value={recentEnd} min={recentStart} onChange={e => setRecentEnd(e.target.value)} />
                  </div>
                </div>
                {recentReports.length === 0 && (
                  <div className="text-center py-6">
                    <div className="text-sm text-muted-foreground mb-2">No reports found for the selected filters.</div>
                    <div className="text-xs text-muted-foreground">Generate a report above to populate this list, or adjust your date range and type filters.</div>
                  </div>
                )}
                {recentReports
                  .filter(r => recentFilterType === 'all' || r.reportType === recentFilterType)
                  .filter(r => {
                    if (!recentStart && !recentEnd) return true;
                    const d = new Date(r.createdAt);
                    const s = recentStart ? new Date(recentStart + 'T00:00:00') : new Date(0);
                    const e = recentEnd ? new Date(recentEnd + 'T23:59:59') : new Date(8640000000000000);
                    return d >= s && d <= e;
                  })
                  .map((r) => (
                  <div key={r.id} className="flex items-center justify-between border rounded-lg p-3">
                    <div className="min-w-0">
                      <div className="font-medium text-foreground truncate">{r.title}</div>
                      <div className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString()} • {r.reportType}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedReport(r) || setModalOpen(true)}>Open</Button>
                      <Button variant="secondary" size="sm" onClick={() => {
                        const data = r.dataJson || {};
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${r.title.replace(/\s+/g,'_')}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}>Download JSON</Button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={cursorStack.length === 0}
                    onClick={() => {
                      const stack = [...cursorStack];
                      const prev = stack.pop();
                      setCursorStack(stack);
                      setRecentCursor(prev || null);
                    }}
                  >Prev</Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (recentResp?.continueCursor) {
                        setCursorStack((s) => [...s, recentCursor]);
                        setRecentCursor(recentResp.continueCursor);
                      }
                    }}
                    disabled={!recentResp?.continueCursor}
                  >Next</Button>
                  <Button variant="outline" size="sm" onClick={() => { setCursorStack([]); setRecentCursor(null); }}>Reset</Button>
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
        )}

        {/* Audit Log Tab */}
        {defaultTab === "Audit" && (
          <div className="space-y-6">
            <AuditLogTab
              auditLogs={auditLogs}
              currentUser={user}
            />
          </div>
        )}

        {/* Messages Tab (Chat) */}
        {defaultTab === "Messages" && (
          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-card-foreground">Messages</CardTitle>
                <CardDescription>Chat with clients and team members</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Select a conversation from the Messages section to start chatting.</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Authentication Required</h2>
          <p className="text-muted-foreground">Please sign in to access the workspace.</p>
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
