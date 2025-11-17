// “Referral Intake Dashboard” - the main admin-facing page for managing new referrals.
// Used ChatGPT (OpenAI GPT-5) to help document this file.
// Prompt - "add explanatory comments for each line of code."
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Search, Plus, X } from "lucide-react";

// --- ICONS ---
/** Renders a search icon. */
const SearchIcon = () => ( <Search className="h-5 w-5 text-gray-400" /> );
/**
 * Renders a plus icon. Used for 'Create New Referral' button.
 * @returns {JSX.Element} The plus icon SVG.
 */
const PlusIcon = () => ( <Plus className="h-5 w-5" /> );

/**
 * Renders a close icon ('X'). Used for closing modals.
 * @returns {JSX.Element} The close icon SVG.
 */
const CloseIcon = () => (<X className="h-5 w-5" />);

// --- MODAL COMPONENTS ---

/**
 * Renders a read-only modal with full referral details, including formatted additional notes.
 */
const ReferralDetailsModal = ({ referral, onClose }) => {
    const formatAdditionalNotes = (text) => {
        if (!text) return null;
        const lines = String(text).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) return null;
        return (
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                {lines.map((line, idx) => {
                    const [label, ...rest] = line.split(':');
                    const value = rest.join(':').trim();
                    if (rest.length > 0 && label.trim()) {
                        return (
                            <li key={idx}>
                                <span className="font-medium">{label.trim()}:</span> {value}
                            </li>
                        );
                    }
                    return <li key={idx}>{line}</li>;
                })}
            </ul>
        );
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Referral Details</DialogTitle>
                    <DialogDescription>
                        {referral.client_first_name} {referral.client_last_name}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 text-sm">
                    <div>
                        <div className="text-gray-500">Client</div>
                        <div className="text-gray-900 font-medium capitalize">
                            {referral.client_first_name} {referral.client_last_name}
                        </div>
                        <div className="text-gray-700">
                            {referral.age !== null && referral.age !== undefined ? `Age: ${referral.age}` : null}
                            {referral.gender ? `  •  Gender: ${referral.gender}` : null}
                        </div>
                    </div>
                    <div>
                        <div className="text-gray-500">Contact</div>
                        <div className="text-gray-700">
                            {referral.phone ? (<div>Phone: {referral.phone}</div>) : null}
                            {referral.email ? (<div>Email: {referral.email}</div>) : null}
                            {referral.address ? (<div>Address: {referral.address}</div>) : null}
                        </div>
                    </div>
                    <div>
                        <div className="text-gray-500">Referral</div>
                        <div className="text-gray-700">
                            <div>Source: {referral.referral_source || 'Unknown'}</div>
                            {referral.submitted_date ? (
                                <div>Submitted: {new Date(referral.submitted_date).toLocaleString()}</div>
                            ) : null}
                            {referral.reason_for_referral ? (
                                <div className="mt-2">
                                    <div className="text-gray-500">Reason</div>
                                    <div className="text-gray-800 whitespace-pre-wrap">{referral.reason_for_referral}</div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                    {referral.additional_notes ? (
                        <div>
                            <div className="text-gray-500">Additional Details</div>
                            <div className="mt-1">{formatAdditionalNotes(referral.additional_notes)}</div>
                        </div>
                    ) : null}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

/**
 * A modal for accepting a new referral.
 * It includes a form to assign a therapist, set a priority level, and add notes.
 * @param {object} props - The component props.
 * @param {object} props.referral - The referral data object.
 * @param {Function} props.onClose - The function to call to close the modal.
 * @returns {JSX.Element} The AcceptReferralModal component.
 */
const AcceptReferralModal = ({ referral, onClose, onAccept, therapists, loadingTherapists, errorTherapists }) => {
    const [selectedTherapist, setSelectedTherapist] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onAccept(selectedTherapist);
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Submit Referral to Team Leader for {referral.client_first_name} {referral.client_last_name}</DialogTitle>
                    <DialogDescription>
                        {/* Optional: Add a description if needed */}
                    </DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="assignTherapist" className="block text-sm font-medium text-gray-700">Assign to Team Leader</label>
                        {loadingTherapists ? (
                            <p>Loading team leaders...</p>
                        ) : errorTherapists ? (
                            <p className="text-red-500">Error: {errorTherapists}</p>
                        ) : (
                            <Select onValueChange={setSelectedTherapist} value={selectedTherapist}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Team Leader..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {therapists.map(therapist => (
                                    <SelectItem key={therapist.id} value={therapist.id.toString()}>{therapist.email}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes (optional)</label>
                        <Textarea id="notes" rows="3" placeholder="Add any relevant notes..."></Textarea>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={!selectedTherapist || loadingTherapists}>Submit to Team Leader</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

/**
 * A modal for declining a new referral.
 * It includes a form to provide a reason for declining and add notes.
 * @param {object} props - The component props.
 * @param {object} props.referral - The referral data object.
 * @param {Function} props.onClose - The function to call to close the modal.
 * @returns {JSX.Element} The DeclineReferralModal component.
 */
const DeclineReferralModal = ({ referral, onClose, onDecline }) => (
   <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Decline Referral for {referral.client_name}</DialogTitle>
                <DialogDescription>
                    {/* Optional: Add a description if needed */}
                </DialogDescription>
            </DialogHeader>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onDecline(); }}>
                <div>
                    <label htmlFor="declineReason" className="block text-sm font-medium text-gray-700">Reason for Decline</label>
                    <Select onValueChange={() => {}}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Reason..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="outside_scope">Outside of scope</SelectItem>
                            <SelectItem value="client_not_reachable">Client not reachable</SelectItem>
                            <SelectItem value="duplicate_referral">Duplicate referral</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label htmlFor="declineNotes" className="block text-sm font-medium text-gray-700">Notes</label>
                    <Textarea id="declineNotes" rows="3" placeholder="Please provide a brief explanation..."></Textarea>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Decline Referral</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
);

/**
 * The main page for managing new referrals.
 * This page displays a table of new referrals and allows the admin to accept or decline them.
 * It uses state to manage the visibility of the accept and decline modals.
 * @returns {JSX.Element} The ReferralIntakePage component.
 */
export default function ReferralIntakePage() {
    const [referrals, setReferrals] = useState([]);
    const { user } = useUser();
    const [modal, setModal] = useState({ type: null, data: null });
    const [searchQuery, setSearchQuery] = useState('');

    const convexReferrals = useQuery(api.referrals.listAll);
    useEffect(() => {
        if (Array.isArray(convexReferrals)) {
            // Map convex camelCase fields to legacy snake_case keys used by this table
            const mapped = convexReferrals.map(r => ({
                id: r._id, // Convex document id
                client_first_name: r.clientFirstName,
                client_last_name: r.clientLastName,
                age: r.age ?? null,
                gender: r.gender, // may be undefined
                phone: r.phone,
                email: r.email,
                address: r.address,
                referral_source: r.referralSource,
                reason_for_referral: r.reasonForReferral,
                additional_notes: r.additionalNotes,
                submitted_date: r.submittedDate ?? r.createdAt,
                status: (r.status || 'pending').replace(/^pending$/i, 'pending'),
            }));
            setReferrals(mapped);
        }
    }, [convexReferrals]);

    const teamLeaders = useQuery(
        api.users.list,
        user?.id ? { clerkId: user.id, roleId: 'team_leader', status: 'active' } : 'skip'
    );
    const therapists = useMemo(() => {
        if (!Array.isArray(teamLeaders)) return [];
        return teamLeaders.map(tl => ({ id: tl.clerkId, email: tl.email }));
    }, [teamLeaders]);
    const loadingTherapists = teamLeaders === undefined;

    const openModal = (type, referral) => setModal({ type, data: referral });
    const closeModal = () => setModal({ type: null, data: null });

    const updateStatus = useMutation(api.referrals.updateStatus);
    const createNotification = useMutation(api.notifications.create);

    const handleAcceptReferral = async (therapistId) => {
        console.log("therapistId:", therapistId);
        if (!therapistId) {
            alert("Please select a Team Leader.");
            return;
        }
        try {
            await updateStatus({
                referralId: modal.data.id,
                processed_by_user_id: String(therapistId),
                status: 'in-review',
            });
            await createNotification({
                userId: String(therapistId),
                type: 'referral',
                title: 'New Referral',
                message: `You have a new referral to review: ${modal.data.client_first_name} ${modal.data.client_last_name}`,
            });
            setReferrals(referrals.map(r =>
                r.id === modal.data.id ? { ...r, status: 'in-review' } : r
            ));
            closeModal();
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Unknown error';
            alert(`Failed to assign referral: ${msg}`);
        }
    };

    const handleDeclineReferral = async () => {
        try {
            await updateStatus({
                referralId: modal.data.id,
                status: 'declined',
            });
            setReferrals(referrals.filter(r => r.id !== modal.data.id));
            closeModal();
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Unknown error';
            alert(`Failed to decline referral: ${msg}`);
        }
    };

    const filteredReferrals = Array.isArray(referrals) ? referrals.filter(referral => {
        const lowercasedQuery = searchQuery.toLowerCase();
        return (
            referral.client_first_name.toLowerCase().includes(lowercasedQuery) ||
            referral.client_last_name.toLowerCase().includes(lowercasedQuery) ||
            referral.referral_source.toLowerCase().includes(lowercasedQuery) ||
            referral.status.toLowerCase().includes(lowercasedQuery)
        );
    }) : [];

    const detailsPreview = (referral) => {
        const src = (referral.additional_notes && referral.additional_notes.trim())
            ? referral.additional_notes
            : (referral.reason_for_referral || '');
        const firstLine = String(src).split(/\r?\n/).find(l => (l || '').trim()) || '';
        const trimmed = firstLine.trim();
        return trimmed.length > 140 ? trimmed.slice(0, 137) + '...' : trimmed;
    };

    const statusClasses = (status) => {
        const s = (status || '').toLowerCase();
        switch (s) {
            case 'pending':
                return 'bg-amber-100 text-amber-800';
            case 'in-review':
                return 'bg-indigo-100 text-indigo-800';
            case 'accepted':
                return 'bg-emerald-100 text-emerald-800';
            case 'declined':
                return 'bg-rose-100 text-rose-800';
            default:
                return 'bg-blue-100 text-blue-800';
        }
    };

    const displayReferralId = (val) => {
        try {
            const s = typeof val === 'string' ? val : (val && val.toString ? val.toString() : '');
            return s ? `#${s.slice(-6)}` : '—';
        } catch {
            return '—';
        }
    };

    return (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg w-full">
            <div className="flex flex-col md:flex-row items-center mb-6 gap-4">
                <h1 className="text-xl font-bold text-gray-800 mr-4">New Referrals</h1>
                <div className="relative w-full md:w-1/3">
                    <Input
                        type="text"
                        placeholder="Search Referrals..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon /></div>
                </div>
                <Link href="/admin/referral-intake/create" passHref>
                    <Button className="ml-auto">
                        <Plus className="h-5 w-5 mr-2" />
                        Create New Referral
                    </Button>
                </Link>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-teal-600 to-cyan-600">
                        <tr>
                            {['Referral ID', 'Client Name', 'Referred By', 'Referral Date', 'Details', 'Status', 'Action'].map(header => (
                                <th key={header} className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredReferrals.length > 0 ? (
                            filteredReferrals.map(referral => (
                                <tr key={referral.id} className="hover:bg-teal-50/40">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{displayReferralId(referral.id)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 capitalize">{referral.client_first_name} {referral.client_last_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{referral.referral_source}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(referral.submitted_date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700 align-top w-96 md:w-[28rem]">
                                        <div className="bg-teal-50/50 border border-teal-100 rounded-md px-3 py-2">
                                            <span
                                                className="block"
                                                style={{
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                {detailsPreview(referral) || '—'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${statusClasses(referral.status)}`}>{referral.status}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <Button size="sm" variant="secondary" onClick={() => openModal('details', referral)}>View Details</Button>
                                        <Button size="sm" onClick={() => openModal('accept', referral)}>Submit to Team Leader</Button>
                                        <Button size="sm" variant="outline" onClick={() => openModal('decline', referral)}>Decline</Button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">No referrals found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {modal.type === 'accept' && (
                <AcceptReferralModal 
                    referral={modal.data} 
                    onClose={closeModal} 
                    onAccept={handleAcceptReferral} 
                    therapists={therapists} 
                    loadingTherapists={loadingTherapists}
                />
            )}
            {modal.type === 'decline' && <DeclineReferralModal referral={modal.data} onClose={closeModal} onDecline={handleDeclineReferral} />}
            {modal.type === 'details' && <ReferralDetailsModal referral={modal.data} onClose={closeModal} />}
        </div>
    );
}