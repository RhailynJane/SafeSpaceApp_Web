// File path: app/(admin)/referral-intake/page.js

'use client';
import React, { useState } from 'react';
import Link from 'next/link';

// --- MOCK DATA ---
// This is mock data for new referrals. In a real application, this would be fetched from an API.
const referrals = [
    { id: 'RFP-001', clientName: 'Alice Johnson', referredBy: 'Dr. Smith', date: '2025-09-08', status: 'New' },
    { id: 'RFP-002', clientName: 'Bob Williams', referredBy: 'Community Clinic', date: '2025-09-08', status: 'New' },
    { id: 'RFP-003', clientName: 'Charlie Brown', referredBy: 'Self-Referral', date: '2025-09-07', status: 'New' },
    { id: 'RFP-004', clientName: 'Diana Miller', referredBy: 'Dr. Evans', date: '2025-09-06', status: 'New' },
];

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
const AcceptReferralModal = ({ referral, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Accept Referral for {referral.clientName}</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><CloseIcon/></button>
            </div>
            <form className="space-y-4">
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
const DeclineReferralModal = ({ referral, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Decline Referral for {referral.clientName}</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><CloseIcon/></button>
            </div>
            <form className="space-y-4">
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
    // State to manage which modal is currently open ('accept', 'decline', or null) and the data for that modal.
    const [modal, setModal] = useState({ type: null, data: null });

    // Function to open a modal with the specified type and referral data.
    const openModal = (type, referral) => setModal({ type, data: referral });
    // Function to close any open modal.
    const closeModal = () => setModal({ type: null, data: null });

    return (
        <div className="bg-white p-8 rounded-2xl shadow-lg">
            {/* Page header with a title and a button to create a new referral. */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold text-gray-800">New Referrals</h1>
                 <Link href="/admin/referral-intake/create" className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors">
                    <PlusIcon />
                    Create New Referral
                </Link>
            </div>
            
            {/* Table to display the list of new referrals. */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-teal-50">
                        <tr>
                            {/* Dynamically generate table headers. */}
                            {['Referral ID', 'Client Name', 'Referred By', 'Referral Date', 'Status', 'Action'].map(header => (
                                <th key={header} className="px-6 py-3 text-left text-xs font-bold text-teal-800 uppercase tracking-wider">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {/* Map over the referrals data to create a table row for each referral. */}
                        {referrals.map(referral => (
                            <tr key={referral.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{referral.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{referral.clientName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{referral.referredBy}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{referral.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">{referral.status}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    {/* Buttons to open the accept and decline modals. */}
                                    <button onClick={() => openModal('accept', referral)} className="px-4 py-1.5 border border-transparent rounded-md text-xs text-white bg-green-600 hover:bg-green-700">Accept</button>
                                    <button onClick={() => openModal('decline', referral)} className="px-4 py-1.5 border border-gray-300 rounded-md text-xs text-gray-700 bg-white hover:bg-gray-100">Decline</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Conditionally render the modals based on the 'modal' state. */}
            {modal.type === 'accept' && <AcceptReferralModal referral={modal.data} onClose={closeModal} />}
            {modal.type === 'decline' && <DeclineReferralModal referral={modal.data} onClose={closeModal} />}
        </div>
    );
}