'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// --- ICONS ---
/**
 * Renders a plus icon. Used for 'Create New Referral' button.
 * @returns {JSX.Element} The plus icon SVG.
 */
const PlusIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> );

/**
 * Renders a close icon ('X'). Used for closing modals.
 * @returns {JSX.Element} The close icon SVG.
 */
const CloseIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> );

// --- MODAL COMPONENTS ---

/**
 * A modal for accepting a new referral.
 * It includes a form to assign a therapist, set a priority level, and add notes.
 * @param {object} props - The component props.
 * @param {object} props.referral - The referral data object.
 * @param {Function} props.onClose - The function to call to close the modal.
 * @returns {JSX.Element} The AcceptReferralModal component.
 */
const AcceptReferralModal = ({ referral, onClose, onAccept }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Accept Referral for {referral.client_name}</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><CloseIcon/></button>
            </div>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onAccept(); }}>
                <div>
                    <label htmlFor="assignTherapist" className="block text-sm font-medium text-gray-700">Assign to Therapist</label>
                    <select id="assignTherapist" className="mt-1 block w-full p-3 border border-gray-300 rounded-lg bg-white">
                        <option>Select Therapist...</option>
                        <option>Dr. Emily Carter</option>
                        <option>Dr. Ben Adams</option>
                    </select>
                </div>
                 <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority Level</label>
                    <select id="priority" className="mt-1 block w-full p-3 border border-gray-300 rounded-lg bg-white">
                        <option>Select Priority...</option>
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes (optional)</label>
                    <textarea id="notes" rows="3" className="mt-1 block w-full p-3 border border-gray-300 rounded-lg" placeholder="Add any relevant notes..."></textarea>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button type="submit" className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700">Assign Referral</button>
                </div>
            </form>
        </div>
    </div>
);

/**
 * A modal for declining a new referral.
 * It includes a form to provide a reason for declining and add notes.
 * @param {object} props - The component props.
 * @param {object} props.referral - The referral data object.
 * @param {Function} props.onClose - The function to call to close the modal.
 * @returns {JSX.Element} The DeclineReferralModal component.
 */
const DeclineReferralModal = ({ referral, onClose, onDecline }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Decline Referral for {referral.client_name}</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><CloseIcon/></button>
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
    const [modal, setModal] = useState({ type: null, data: null });

    useEffect(() => {
        const getReferrals = async () => {
            const res = await fetch('/api/referrals');
            const data = await res.json();
            setReferrals(data.filter(r => r.status === 'pending'));
        };
        getReferrals();
    }, []);

    const openModal = (type, referral) => setModal({ type, data: referral });
    const closeModal = () => setModal({ type: null, data: null });

    const handleAcceptReferral = async () => {
        const res = await fetch(`/api/referrals/${modal.data.id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'accepted' }),
        });
        if (res.ok) {
            setReferrals(referrals.filter(r => r.id !== modal.data.id));
            closeModal();
        }
    };

    const handleDeclineReferral = async () => {
        const res = await fetch(`/api/referrals/${modal.data.id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'declined' }),
        });
        if (res.ok) {
            setReferrals(referrals.filter(r => r.id !== modal.data.id));
            closeModal();
        }
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold text-gray-800">New Referrals</h1>
                 <Link href="/admin/referral-intake/create" className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors">
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
                        {referrals.map(referral => (
                            <tr key={referral.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{referral.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{referral.client_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{referral.referral_source}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(referral.submitted_date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">{referral.status}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    <button onClick={() => openModal('accept', referral)} className="px-4 py-1.5 border border-transparent rounded-md text-xs text-white bg-green-600 hover:bg-green-700">Accept</button>
                                    <button onClick={() => openModal('decline', referral)} className="px-4 py-1.5 border border-gray-300 rounded-md text-xs text-gray-700 bg-white hover:bg-gray-100">Decline</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {modal.type === 'accept' && <AcceptReferralModal referral={modal.data} onClose={closeModal} onAccept={handleAcceptReferral} />}
            {modal.type === 'decline' && <DeclineReferralModal referral={modal.data} onClose={closeModal} onDecline={handleDeclineReferral} />}
        </div>
    );
}
