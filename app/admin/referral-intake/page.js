// “Referral Intake Dashboard” - the main admin-facing page for managing new referrals.
// Used ChatGPT (OpenAI GPT-5) to help document this file.
// Prompt - "add explanatory comments for each line of code."
'use client';
import React, { useState, useEffect } from 'react';
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
    const [therapists, setTherapists] = useState([]);
    const [loadingTherapists, setLoadingTherapists] = useState(true);
    const [errorTherapists, setErrorTherapists] = useState(null);
    const [modal, setModal] = useState({ type: null, data: null });
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const getReferrals = async () => {
            const res = await fetch('/api/referrals');
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
        const getTherapists = async () => {
            try {
                setLoadingTherapists(true);
                const res = await fetch('/api/admin/therapists');
                if (!res.ok) {
                    throw new Error(`Failed to fetch therapists: ${res.status} ${res.statusText}`);
                }
                const data = await res.json();
                if (Array.isArray(data)) {
                    setTherapists(data);
                } else {
                    console.error("Fetched therapists data is not an array:", data);
                    setTherapists([]);
                    setErrorTherapists("Invalid data format for therapists.");
                }
            } catch (error) {
                console.error('Error fetching therapists:', error);
                setTherapists([]);
                setErrorTherapists(error.message);
            } finally {
                setLoadingTherapists(false);
            }
        };
        getReferrals();
        getTherapists();
    }, []);

    const openModal = (type, referral) => setModal({ type, data: referral });
    const closeModal = () => setModal({ type: null, data: null });

    const handleAcceptReferral = async (therapistId) => {
        console.log("therapistId:", therapistId);
        if (!therapistId) {
            alert("Please select a Team Leader.");
            return;
        }
        const res = await fetch(`/api/referrals/${modal.data.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                processed_by_user_id: therapistId,
                status: 'in-review'
            }),
        });
        if (res.ok) {
            await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: parseInt(therapistId, 10),
                    message: `You have a new referral to review: ${modal.data.client_first_name} ${modal.data.client_last_name}`,
                }),
            });
            setReferrals(referrals.map(r =>
                r.id === modal.data.id ? { ...r, status: 'in-review' } : r
            ));
            closeModal();
        } else {
            const errorData = await res.json();
            alert(`Failed to assign referral: ${errorData.error || 'Unknown error'}`);
        }
    };

    const handleDeclineReferral = async () => {
        const res = await fetch(`/api/referrals/${modal.data.id}`,
        {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'declined' }),
        });
        if (res.ok) {
            setReferrals(referrals.filter(r => r.id !== modal.data.id));
            closeModal();
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

    return (
        <div className="bg-white p-8 rounded-2xl shadow-lg">
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
                    <thead className="bg-teal-50">
                        <tr>
                            {['Referral ID', 'Client Name', 'Referred By', 'Referral Date', 'Status', 'Action'].map(header => (
                                <th key={header} className="px-6 py-3 text-left text-xs font-bold text-teal-800 uppercase tracking-wider">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredReferrals.length > 0 ? (
                            filteredReferrals.map(referral => (
                                <tr key={referral.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{referral.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 capitalize">{referral.client_first_name} {referral.client_last_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{referral.referral_source}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(referral.submitted_date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">{referral.status}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
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
                    errorTherapists={errorTherapists}
                />
            )}
            {modal.type === 'decline' && <DeclineReferralModal referral={modal.data} onClose={closeModal} onDecline={handleDeclineReferral} />}
        </div>
    );
}