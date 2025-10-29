
"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Search, Filter, Calendar, Clock, Eye, CheckCircle, X } from "lucide-react";

// --- ICONS ---
const SearchIcon = () => (<Search className="h-5 w-5 text-gray-400" />);
const FilterIcon = () => (<Filter className="h-5 w-5" />);
const CalendarIcon = () => (<Calendar className="h-4 w-4" />);
const ClockIcon = () => (<Clock className="h-4 w-4" />);
const EyeIcon = () => (<Eye className="h-4 w-4" />);
const CheckCircleIcon = () => (<CheckCircle className="h-4 w-4" />);

function TimelineModal({ data, onClose }) {
    const getStatusColor = (status) => {
        switch (status) {
            case "SUBMITTED": return "bg-yellow-100 text-yellow-800";
            case "PENDING": return "bg-yellow-100 text-yellow-800";
            case "IN REVIEW": return "bg-blue-100 text-blue-800";
            case "ACCEPTED": return "bg-green-100 text-green-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };
    const getIconWrapperColor = (status) => {
        switch (status) {
            case "SUBMITTED": return "bg-yellow-200 text-yellow-800";
            case "PENDING": return "bg-yellow-200 text-yellow-800";
            case "IN REVIEW": return "bg-blue-200 text-blue-800";
            case "ACCEPTED": return "bg-green-200 text-green-800";
            default: return "bg-gray-200 text-gray-800";
        }
    };
    const iconMap = {
        ClockIcon: <Clock className="h-5 w-5" />,
        EyeIcon: <Eye className="h-5 w-5" />,
        CheckCircleIcon: <CheckCircle className="h-5 w-5" />,
    };
    const eventsWithIcons = data.events.map(event => ({
        ...event,
        iconComponent: iconMap[event.icon] || <Clock className="h-5 w-5" />,
    }));
    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="w-full max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="capitalize">Referral Timeline - {data.client_first_name} {data.client_last_name}</DialogTitle>
                    <DialogDescription>Complete status history and processing timeline</DialogDescription>
                </DialogHeader>
                <div className="text-sm space-y-2 mb-8 text-center bg-gray-50 p-4 rounded-lg">
                    <p className="capitalize"><span className="font-semibold text-gray-600">Client:</span> {data.client_first_name} {data.client_last_name}</p>
                    <p><span className="font-semibold text-gray-600">Submitted by:</span> {data.processed_by_user_id}</p>
                    <p><span className="font-semibold text-gray-600">Current Status:</span> <span className={`px-2 py-1 rounded font-medium text-xs ${getStatusColor(data.status.toUpperCase())}`}>{data.status}</span></p>
                </div>
                <div className="relative pl-8">
                    <div className="absolute left-8 top-1 bottom-1 w-0.5 bg-gray-200" aria-hidden="true"></div>
                    {eventsWithIcons.map((event, index) => (
                        <div key={index} className="relative pl-8 mb-8">
                            <div className="absolute left-0 top-0 transform -translate-x-1/2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ring-8 ring-white ${getIconWrapperColor(event.status)}`}>{event.iconComponent}</div>
                            </div>
                            <div className="pl-6">
                                <div className="flex items-center justify-between">
                                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${getStatusColor(event.status)}`}>{event.status}</span>
                                    <span className="text-xs text-gray-500">{new Date(event.created_at).toLocaleString()}</span>
                                </div>
                                <p className="text-sm font-semibold text-gray-700 mt-2">{event.actor}</p>
                                <div className="mt-2 p-3 bg-gray-100 rounded-md text-sm text-gray-600">{event.note}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <Button onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function ReferralTrackingPage() {
    const [referrals, setReferrals] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
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
            return (
                ref.client_first_name.toLowerCase().includes(lowercasedQuery) ||
                ref.client_last_name.toLowerCase().includes(lowercasedQuery) ||
                ref.referral_source.toLowerCase().includes(lowercasedQuery)
            );
        });
        setFilteredReferrals(filtered);
    }, [searchQuery, referrals]);

    const handleViewTimeline = async (referral) => {
        const res = await fetch(`/api/referrals/${referral.id}/timeline`);
        const data = await res.json();
        setSelectedReferral({ ...referral, events: data });
        setShowTimelineModal(true);
    };

    const ProgressTracker = ({ steps, currentProgress }) => (
        <div className="flex items-center gap-2 flex-wrap">
            {steps.map((step, index) => {
                const isActive = currentProgress.includes(step);
                return (
                    <React.Fragment key={step}>
                        <div className="flex items-center gap-1.5">
                            {isActive ? <CheckCircleIcon className="text-green-500" /> : <ClockIcon className="text-gray-400" />}
                            <span className={`text-sm ${isActive ? "text-gray-700 font-medium" : "text-gray-400"}`}>{step}</span>
                        </div>
                        {index < steps.length - 1 && <span className="mx-1">→</span>}
                    </React.Fragment>
                );
            })}
        </div>
    );

    return (
        <div>
            <div className="bg-white p-8 rounded-2xl shadow-lg">
                <h1 className="text-xl font-bold text-gray-800">Referral Status Tracking</h1>
                <p className="text-gray-500 mb-6">Monitor the progress of all referrals from submission to completion</p>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-grow">
                        <Input type="text" placeholder="Search by client name or referral source" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3" />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon /></div>
                    </div>
                    <div className="relative">
                        <Select>
                        <SelectTrigger className="w-full md:w-auto appearance-none pl-10 pr-4 py-3">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_review">In Review</SelectItem>
                            <SelectItem value="accepted">Accepted</SelectItem>
                            <SelectItem value="declined">Declined</SelectItem>
                        </SelectContent>
                    </Select>
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FilterIcon /></div>
                    </div>
                </div>
                <div className="space-y-4">
                    {filteredReferrals.map(ref => (
                        <div key={ref.id} className="bg-white p-6 rounded-lg border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800 capitalize">{ref.client_first_name} {ref.client_last_name}</h3>
                                <p className="text-sm text-gray-500 mb-3">Age: {ref.age}</p>
                                <ProgressTracker steps={["pending", "accepted", "in-progress", "completed"]} currentProgress={[ref.status]} />
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto mt-4 md:mt-0">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <CalendarIcon />
                                    <span>Submitted: {new Date(ref.submitted_date).toLocaleDateString()}</span>
                                </div>
                                <Button onClick={() => handleViewTimeline(ref)} variant="outline" size="sm">View Timeline</Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {showTimelineModal && selectedReferral && (
                <TimelineModal data={selectedReferral} onClose={() => setShowTimelineModal(false)} />
            )}
        </div>
    );
}
