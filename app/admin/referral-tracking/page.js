
"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Search, Filter, Calendar, Clock, Eye, CheckCircle, X } from "lucide-react";

// --- ICONS ---
const SearchIcon = () => (<Search className="h-5 w-5 text-gray-400" />);
const FilterIcon = () => (<Filter className="h-5 w-5 text-gray-400" />);
const CalendarIcon = () => (<Calendar className="h-4 w-4" />);
const ClockIcon = () => (<Clock className="h-4 w-4" />);
const EyeIcon = () => (<Eye className="h-4 w-4" />);
const CheckCircleIcon = () => (<CheckCircle className="h-4 w-4" />);

function TimelineModal({ data, onClose }) {
    const getStatusColor = (status) => {
        const s = (status || '').toUpperCase();
        if (s === "SUBMITTED" || s === "PENDING") return "bg-yellow-100 text-yellow-800 border-yellow-300";
        if (s === "IN REVIEW" || s === "IN-REVIEW") return "bg-blue-100 text-blue-800 border-blue-300";
        if (s === "ACCEPTED") return "bg-green-100 text-green-800 border-green-300";
        if (s === "DECLINED") return "bg-red-100 text-red-800 border-red-300";
        return "bg-gray-100 text-gray-800 border-gray-300";
    };
    const getIconWrapperColor = (status) => {
        const s = (status || '').toUpperCase();
        if (s === "SUBMITTED" || s === "PENDING") return "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg";
        if (s === "IN REVIEW" || s === "IN-REVIEW") return "bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg";
        if (s === "ACCEPTED") return "bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg";
        if (s === "DECLINED") return "bg-gradient-to-br from-red-400 to-red-600 text-white shadow-lg";
        return "bg-gradient-to-br from-gray-400 to-gray-600 text-white shadow-lg";
    };
    const iconMap = {
        ClockIcon: <Clock className="h-5 w-5" />,
        EyeIcon: <Eye className="h-5 w-5" />,
        CheckCircleIcon: <CheckCircle className="h-5 w-5" />,
    };
    const eventsWithIcons = (data.events || []).map(event => ({
        ...event,
        iconComponent: iconMap[event.icon] || <Clock className="h-5 w-5" />,
    }));
    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="capitalize text-2xl bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">Referral Timeline - {data.client_first_name} {data.client_last_name}</DialogTitle>
                    <DialogDescription className="text-base">Complete status history and processing timeline</DialogDescription>
                </DialogHeader>
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-xl border-2 border-teal-200 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Client</p>
                            <p className="capitalize text-lg font-bold text-gray-800">{data.client_first_name} {data.client_last_name}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Referral Source</p>
                            <p className="text-lg font-bold text-gray-800">{data.referral_source || 'Unknown'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Current Status</p>
                            <span className={`inline-block px-3 py-1.5 rounded-full font-bold text-sm border-2 ${getStatusColor((data.status || 'pending').toUpperCase())}`}>
                                {(data.status || 'pending').toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>
                {eventsWithIcons.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No timeline events available</p>
                    </div>
                ) : (
                    <div className="relative pl-12">
                        <div className="absolute left-8 top-1 bottom-1 w-1 bg-gradient-to-b from-teal-200 via-cyan-200 to-teal-200 rounded-full" aria-hidden="true"></div>
                        {eventsWithIcons.map((event, index) => (
                            <div key={index} className="relative pl-8 mb-10 last:mb-0">
                                <div className="absolute left-0 top-0 transform -translate-x-1/2">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-white ${getIconWrapperColor(event.status)}`}>
                                        {event.iconComponent}
                                    </div>
                                </div>
                                <div className="pl-6 bg-white dark:bg-gray-800 p-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-teal-300 transition-colors">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full border-2 ${getStatusColor(event.status)}`}>
                                            {(event.status || 'UNKNOWN').toUpperCase()}
                                        </span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                            {event.timestamp ? new Date(event.timestamp).toLocaleString() : 'Unknown date'}
                                        </span>
                                    </div>
                                    <p className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-2">{event.message || event.actor || 'Event'}</p>
                                    {event.note && (
                                        <div className="mt-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg border border-gray-200 dark:border-gray-600">
                                            <p className="text-sm text-gray-700 dark:text-gray-200">{event.note}</p>
                                        </div>
                                    )}
                                    {event.actor && event.message !== event.actor && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                            <span className="font-semibold">By:</span> {event.actor}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <DialogFooter className="mt-6">
                    <Button onClick={onClose} className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white">Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function ReferralTrackingPage() {
    const [referrals, setReferrals] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [filteredReferrals, setFilteredReferrals] = useState([]);
    const [showTimelineModal, setShowTimelineModal] = useState(false);
    const [selectedReferral, setSelectedReferral] = useState(null);

    useEffect(() => {
        const getReferrals = async () => {
            const res = await fetch("/api/referrals");
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setReferrals(data);
                } else {
                    console.error("Fetched data is not an array:", data);
                    setReferrals([]); // Set to empty array to prevent crash
                }
            } else {
                console.error("Failed to fetch referrals:", res.status, res.statusText);
                setReferrals([]); // Set to empty array to prevent crash
            }
        };
        getReferrals();
    }, []);

    useEffect(() => {
        const lowercasedQuery = searchQuery.toLowerCase();
        const filtered = referrals.filter(ref => {
            const matchesSearch = (
                (ref.client_first_name || '').toLowerCase().includes(lowercasedQuery) ||
                (ref.client_last_name || '').toLowerCase().includes(lowercasedQuery) ||
                (ref.referral_source || '').toLowerCase().includes(lowercasedQuery)
            );
            const matchesStatus = statusFilter === "all" || (ref.status || '').toLowerCase().replace(/[_-]/g, '') === statusFilter.toLowerCase().replace(/[_-]/g, '');
            return matchesSearch && matchesStatus;
        });
        setFilteredReferrals(filtered);
    }, [searchQuery, statusFilter, referrals]);

    const handleViewTimeline = async (referral) => {
        try {
            // Fetch real timeline data from Convex
            const response = await fetch(`/api/referrals/${referral._id}/timeline`);
            if (response.ok) {
                const timelineData = await response.json();
                setSelectedReferral({ ...referral, events: timelineData.events || [] });
            } else {
                // Fallback to mock data if API fails
                const mockEvents = [
                    {
                        icon: 'ClockIcon',
                        status: 'SUBMITTED',
                        message: `Referral submitted`,
                        timestamp: referral.submitted_date || Date.now(),
                        actor: 'System',
                        note: `Referral created for ${referral.client_first_name} ${referral.client_last_name}`
                    },
                    ...(referral.status !== 'pending' ? [{
                        icon: 'EyeIcon',
                        status: (referral.status || 'pending').toUpperCase().replace('-', ' '),
                        message: `Status changed to ${referral.status}`,
                        timestamp: referral.processed_date || Date.now(),
                        actor: referral.processed_by_user_id || 'Admin',
                        note: `Referral status updated`
                    }] : [])
                ];
                setSelectedReferral({ ...referral, events: mockEvents });
            }
        } catch (error) {
            console.error('Failed to fetch timeline:', error);
            // Fallback to basic mock data
                const mockEvents = [
                {
                    icon: 'ClockIcon',
                    status: 'SUBMITTED',
                    message: `Referral submitted`,
                    timestamp: referral.submitted_date || Date.now(),
                    actor: 'System',
                    note: `Referral created for ${referral.client_first_name} ${referral.client_last_name}`
                }
            ];
            setSelectedReferral({ ...referral, events: mockEvents });
        }
        setShowTimelineModal(true);
    };

    const ProgressTracker = ({ steps, currentProgress }) => (
        <div className="flex items-center gap-2 flex-wrap">
            {steps.map((step, index) => {
                const isActive = currentProgress.includes(step);
                return (
                    <React.Fragment key={step}>
                        <div className="flex items-center gap-1.5">
                            {isActive ? <CheckCircleIcon className="text-green-500" /> : <ClockIcon className="text-gray-400 dark:text-gray-500" />}
                            <span className={`text-sm ${isActive ? "text-gray-700 dark:text-gray-300 font-medium" : "text-gray-400 dark:text-gray-500"}`}>{step}</span>
                        </div>
                        {index < steps.length - 1 && <span className="mx-1">→</span>}
                    </React.Fragment>
                );
            })}
        </div>
    );

    return (
        <div>
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg">
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Referral Status Tracking</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Monitor the progress of all referrals from submission to completion</p>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-grow">
                        <input type="text" placeholder="Search by client name or referral source" className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon /></div>
                    </div>
                    <div className="relative">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-auto pr-4 py-3">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="inreview">In Review</SelectItem>
                                <SelectItem value="accepted">Accepted</SelectItem>
                                <SelectItem value="declined">Declined</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-4">
                    {filteredReferrals.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 dark:text-gray-400 text-lg">No referrals found matching your criteria</p>
                        </div>
                    ) : (
                        filteredReferrals.map(ref => {
                            const getStatusBadgeColor = (status) => {
                                const s = (status || '').toLowerCase();
                                if (s === 'pending') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
                                if (s === 'in-review' || s === 'inreview') return 'bg-blue-100 text-blue-800 border-blue-300';
                                if (s === 'accepted') return 'bg-green-100 text-green-800 border-green-300';
                                if (s === 'declined') return 'bg-red-100 text-red-800 border-red-300';
                                return 'bg-gray-100 text-gray-800 border-gray-300';
                            };
                            return (
                                <div key={ref._id || ref.id} className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-750 p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-teal-400 hover:shadow-lg transition-all duration-200">
                                    <div className="flex flex-col md:flex-row justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 capitalize">{ref.client_first_name} {ref.client_last_name}</h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Age: {ref.age || 'N/A'} • Source: {ref.referral_source || 'Unknown'}</p>
                                                </div>
                                                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 ${getStatusBadgeColor(ref.status)}`}>
                                                    {(ref.status || 'pending').toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-3">
                                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">Reason for Referral:</p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300">{ref.reason_for_referral || 'No reason provided'}</p>
                                            </div>
                                            <ProgressTracker steps={["pending", "in-review", "accepted"]} currentProgress={[ref.status]} />
                                        </div>
                                        <div className="flex flex-col justify-between items-end gap-3">
                                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
                                                <CalendarIcon />
                                                <span>Submitted: {new Date(ref.submitted_date).toLocaleDateString()}</span>
                                            </div>
                                            {ref.phone && (
                                                <div className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
                                                    <span className="font-semibold">Phone:</span> {ref.phone}
                                                </div>
                                            )}
                                            {ref.email && (
                                                <div className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
                                                    <span className="font-semibold">Email:</span> {ref.email}
                                                </div>
                                            )}
                                            <Button onClick={() => handleViewTimeline(ref)} className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white" size="sm">
                                                <EyeIcon className="mr-2" />View Timeline
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            {showTimelineModal && selectedReferral && (
                <TimelineModal data={selectedReferral} onClose={() => setShowTimelineModal(false)} />
            )}
        </div>
    );
}
