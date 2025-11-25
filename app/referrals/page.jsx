'use client' // specific to Next.js App Router

import { useState, useEffect } from "react" //built-in hook to manage component state
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Calendar,
  FileText,
  Search,
  Filter,
  Eye,
  ArrowRight,
  UserCheck,
} from "lucide-react"

const ApproveReferralModal = ({ referral, onClose, onApprove, supportWorkers }) => {
    const [selectedSupportWorker, setSelectedSupportWorker] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onApprove(selectedSupportWorker);
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Approve and Assign Referral</DialogTitle>
                    <DialogDescription>
                        Approve the referral for {referral.client_first_name} {referral.client_last_name} and assign it to a Support Worker.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="assignSupportWorker" className="block text-sm font-medium text-gray-700">Assign to Support Worker</label>
                        <select id="assignSupportWorker" value={selectedSupportWorker} onChange={(e) => setSelectedSupportWorker(e.target.value)} className="mt-1 block w-full p-3 border border-gray-300 rounded-lg bg-white">
                            <option value="">Select Support Worker...</option>
                            {supportWorkers.map(worker => (
                                <option key={worker.id} value={worker.id}>{worker.first_name} {worker.last_name} ({worker.email})</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit">Approve and Assign</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

const DeclineReferralModal = ({ referral, onClose, onDecline }) => (
    <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Decline Referral</DialogTitle>
                <DialogDescription>
                    Are you sure you want to decline the referral for {referral.client_first_name} {referral.client_last_name}?
                </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-4 pt-4">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button variant="destructive" onClick={onDecline}>Decline Referral</Button>
            </div>
        </DialogContent>
    </Dialog>
);

// functional React component - userRole and showAllReferrals passed as props
export function ReferralStatusTracker({ userRole, showAllReferrals = false }) {
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [modal, setModal] = useState({ type: null, data: null });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [trackedReferrals, setTrackedReferrals] = useState([]);
  const [supportWorkers, setSupportWorkers] = useState([]);

  useEffect(() => {
    const fetchReferrals = async () => {
      const response = await fetch(showAllReferrals ? '/api/referrals' : '/api/referrals/mine');
      if (response.ok) {
        const data = await response.json();
        setTrackedReferrals(data.referrals || data);
      } else {
        console.error('Failed to fetch referrals');
      }
    };

    const fetchSupportWorkers = async () => {
      const response = await fetch('/api/support-workers');
      if (response.ok) {
        const data = await response.json();
        setSupportWorkers(data);
      } else {
        console.error('Failed to fetch support workers');
      }
    };

    fetchReferrals();
    if (userRole === 'team-leader') {
      fetchSupportWorkers();
    }
  }, [userRole, showAllReferrals]);

  const openModal = (type, referral) => setModal({ type, data: referral });
  const closeModal = () => setModal({ type: null, data: null });

  const handleApproveReferral = async (supportWorkerId) => {
    if (!supportWorkerId) {
      alert("Please select a Support Worker.");
      return;
    }
    const res = await fetch(`/api/referrals/${modal.data._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        processed_by_user_id: parseInt(supportWorkerId, 10),
        status: 'accepted'
      }),
    });
    if (res.ok) {
      setTrackedReferrals(trackedReferrals.filter(r => r._id !== modal.data._id));
      closeModal();
    } else {
      const errorData = await res.json();
      alert(`Failed to approve referral: ${errorData.error || 'Unknown error'}`);
    }
  };

  const handleDeclineReferral = async () => {
    const res = await fetch(`/api/referrals/${modal.data._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'declined' }),
    });
    if (res.ok) {
      setTrackedReferrals(trackedReferrals.filter(r => r._id !== modal.data._id));
      closeModal();
    }
  };

  // Helper function : Map status to icon components with colors - return an icon
  // status is taken as paramter
  const getStatusIcon = (status) => {
    switch (status) {
      case "submitted":
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "in-review":
        return <Eye className="h-4 w-4 text-blue-600" />
      case "accepted":
      case "assigned":
      case "in-progress":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "declined":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "info-requested":
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-teal-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  // Helper function : Map status to badge colors - return CSS class string(Tailwind) for color styling
  const getStatusColor = (status) => {
    switch (status) {
      case "submitted":
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "in-review":
        return "bg-blue-100 text-blue-800"
      case "accepted":
      case "assigned":
      case "in-progress":
        return "bg-green-100 text-green-800"
      case "declined":
        return "bg-red-100 text-red-800"
      case "info-requested":
        return "bg-orange-100 text-orange-800"
      case "completed":
        return "bg-teal-100 text-teal-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // filters the full list of referrals based on text search, status filter and priority filter
  const filteredReferrals = trackedReferrals.filter((referral) => {
    const clientName = `${referral.client_first_name || ''} ${referral.client_last_name || ''}`.trim();
    const matchesSearch =
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (referral.referral_source && referral.referral_source.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || referral.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

    // calculate stats for overview cards
    const stats = {
      total: trackedReferrals.length,
      pending: trackedReferrals.filter((r) => r.status === "pending" || r.status === 'in-review').length,
      inProgress: trackedReferrals.filter((r) =>
        ["accepted", "assigned", "in-progress"].includes(r.status),
      ).length,
      completed: trackedReferrals.filter((r) => r.status === "completed").length,
      needsAttention: trackedReferrals.filter((r) => ["info-requested", "declined"].includes(r.status)).length,
    }

  return (
    <div className="space-y-6">
      <h1 className="text-5xl font-bold text-red-500">TEST</h1>
      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Total Referrals</p><p className="text-2xl font-bold text-gray-900">{stats.total}</p></div><div className="p-2 bg-blue-100 rounded-full"><FileText className="h-5 w-5 text-blue-600" /></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Pending Review</p><p className="text-2xl font-bold text-yellow-600">{stats.pending}</p></div><div className="p-2 bg-yellow-100 rounded-full"><Clock className="h-5 w-5 text-yellow-600" /></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">In Progress</p><p className="text-2xl font-bold text-green-600">{stats.inProgress}</p></div><div className="p-2 bg-green-100 rounded-full"><UserCheck className="h-5 w-5 text-green-600" /></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Needs Attention</p><p className="text-2xl font-bold text-red-600">{stats.needsAttention}</p></div><div className="p-2 bg-red-100 rounded-full"><AlertCircle className="h-5 w-5 text-red-600" /></div></div></CardContent></Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Referral Status Tracking
          </CardTitle>
          <CardDescription>Monitor the progress of all referrals from submission to completion</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by client name or referral source..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
              <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-review">In Review</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                  <SelectItem value="info-requested">Info Requested</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Referrals List */}
          <div className="space-y-4">
            {filteredReferrals.map((referral) => (
              <div key={referral._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{referral.client_first_name} {referral.client_last_name}</h3>
                      <Badge className={getStatusColor(referral.status)}><div className="flex items-center gap-1">{getStatusIcon(referral.status)}{referral.status.replace("-", " ").toUpperCase()}</div></Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2"><User className="h-4 w-4" /><span>Age: {referral.age}</span></div>
                      <div className="flex items-center gap-2"><FileText className="h-4 w-4" /><span>{referral.referral_source}</span></div>
                      <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /><span>Submitted: {new Date(referral.submitted_date).toLocaleDateString()}</span></div>
                    </div>
                    {referral.assignedTo && <div className="flex items-center gap-2 text-sm text-teal-600"><UserCheck className="h-4 w-4" /><span>Assigned to: {referral.assignedTo}</span></div>}
                  </div>

                  <div className="ml-4 flex flex-col gap-2">
                    <Button size="sm" variant="outline" onClick={() => openModal('details', referral)}><Eye className="h-4 w-4 mr-1" />View Details</Button>
                    {userRole === 'team-leader' && referral.status === 'in-review' && (
                        <>
                            <Button size="sm" onClick={() => openModal('approve', referral)}>Approve</Button>
                            <Button size="sm" variant="destructive" onClick={() => openModal('decline', referral)}>Decline</Button>
                        </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filteredReferrals.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                <FileText className="mx-auto mb-4 h-16 w-16 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No referrals found</h3>
                <p className="text-sm">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {modal.type === 'approve' && <ApproveReferralModal referral={modal.data} onClose={closeModal} onApprove={handleApproveReferral} supportWorkers={supportWorkers} />}
      {modal.type === 'decline' && <DeclineReferralModal referral={modal.data} onClose={closeModal} onDecline={handleDeclineReferral} />}
      {/* Details Modal is missing, but let's ignore for now */}
    </div>
  )
}

export default function ReferralsPage() {
  const { user } = useUser();
  const rawRole = user?.publicMetadata?.role ?? null;
  const userRole = rawRole ? rawRole.replace(/_/g, "-") : null;
  return <ReferralStatusTracker userRole={userRole} />;
}