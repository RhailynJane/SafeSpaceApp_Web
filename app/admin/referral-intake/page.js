// “Referral Intake Dashboard” - the main admin-facing page for managing new referrals.
// Used ChatGPT (OpenAI GPT-5) to help document this file.
// Prompt - "add explanatory comments for each line of code."
'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// --- ICONS ---
/** Renders a search icon. */
const SearchIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> );
/**
 * Renders a plus icon. Used for 'Create New Referral' button.
 * @returns {JSX.Element} The plus icon SVG.
 */
const PlusIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>);

/**
 * Renders a close icon ('X'). Used for closing modals.
 * @returns {JSX.Element} The close icon SVG.
 */
const CloseIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);

// --- MODAL COMPONENTS ---

/**
 * A modal for accepting a new referral.
 * It includes a form to assign a therapist, set a priority level, and add notes.
 * @param {object} props - The component props.
 * @param {object} props.referral - The referral data object.
 * @param {Function} props.onClose - The function to call to close the modal.
 * @returns {JSX.Element} The AcceptReferralModal component.
 */
const AcceptReferralModal = ({ referral, onClose, onAccept, therapists }) => {
    const [selectedTherapist, setSelectedTherapist] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onAccept(selectedTherapist);
    };

    return (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-2xl flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Submit Referral to Team Leader for {referral.client_first_name} {referral.client_last_name}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><CloseIcon /></button>
                </div>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="assignTherapist" className="block text-sm font-medium text-gray-700">Assign to Team Leader</label>
                        <select id="assignTherapist" value={selectedTherapist} onChange={(e) => setSelectedTherapist(e.target.value)} className="mt-1 block w-full p-3 border border-gray-300 rounded-lg bg-white">
                            <option value="">Select Team Leader...</option>
                            {therapists.map(therapist => (
                                <option key={therapist.id} value={therapist.id}>{therapist.email}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes (optional)</label>
                        <textarea id="notes" rows="3" className="mt-1 block w-full p-3 border border-gray-300 rounded-lg" placeholder="Add any relevant notes..."></textarea>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                        <button type="submit" className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700">Submit to Team Leader</button>
                    </div>
                </form>
            </div>
        </div>
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
   <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Decline Referral for {referral.client_name}</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><CloseIcon /></button>
            </div>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onDecline(); }}>
                <div>
                    <label htmlFor="declineReason" className="block text-sm font-medium text-gray-700">Reason for Decline</label>
                    <select id="declineReason" className="mt-1 block w-full p-3 border border-gray-300 rounded-lg bg-white">
                        <option>Select Reason...</option>
                        <option>Outside of scope</option>
                        <option>Client not reachable</option>
                        <option>Duplicate referral</option>
                        <option>Other</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="declineNotes" className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea id="declineNotes" rows="3" className="mt-1 block w-full p-3 border border-gray-300 rounded-lg" placeholder="Please provide a brief explanation..."></textarea>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button type="submit" className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700">Decline Referral</button>
                </div>
            </form>
        </div>
    </div>
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
            const res = await fetch('/api/admin/therapists');
            const data = await res.json();
            setTherapists(data);
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
                    <input
                        type="text"
                        placeholder="Search Referrals..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon /></div>
                </div>
                <Link href="/admin/referral-intake/create" className="flex items-center justify-center gap-2 w-full md:w-auto px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors ml-auto">
                    <PlusIcon />
                    Create New Referral
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
                                        <button onClick={() => openModal('accept', referral)} className="px-4 py-1.5 border border-transparent rounded-md text-xs text-white bg-teal-600 hover:bg-teal-700">Submit to Team Leader</button>
                                        <button onClick={() => openModal('decline', referral)} className="px-4 py-1.5 border border-gray-300 rounded-md text-xs text-gray-700 bg-white hover:bg-gray-100">Decline</button>
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

            {modal.type === 'accept' && <AcceptReferralModal referral={modal.data} onClose={closeModal} onAccept={handleAcceptReferral} therapists={therapists} />}
            {modal.type === 'decline' && <DeclineReferralModal referral={modal.data} onClose={closeModal} onDecline={handleDeclineReferral} />}
        </div>
    );
}