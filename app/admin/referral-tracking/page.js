// File path: app/(admin)/referral-tracking/page.js

'use client';
import React, { useState } from 'react';

// --- ICONS ---
// A collection of simple, stateless functional components for rendering SVG icons.

/** Renders a search icon. */
const SearchIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> );
/** Renders a filter icon. */
const FilterIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg> );
/** Renders a calendar icon. */
const CalendarIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> );
/** Renders a clock icon. */
const ClockIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> );
/** Renders an eye icon for 'In Review' status. */
const EyeIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> );
/** Renders a check circle icon for completed steps. */
const CheckCircleIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> );
/** Renders a right arrow icon for the progress tracker. */
const ArrowRightIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg> );
/** Renders a close icon ('X') for modals. */
const CloseIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> );

// --- MOCK DATA ---
// In a real application, this data would be fetched from a database via an API.

// Mock data for the list of referrals.
const referrals = [
    { id: 1, name: 'Sarah Johnson', age: 32, submitted: '2025-08-10', status: 'Accepted', progress: ['Pending', 'In Review', 'Accepted'] },
    { id: 2, name: 'John Smith', age: 42, submitted: '2025-08-11', status: 'Pending', progress: ['Pending'] },
];

// Mock data for the detailed timeline of a single referral.
const timelineData = {
    client: 'Sarah Johnson',
    submittedBy: 'admin@safespace.com',
    status: 'Accepted',
    events: [
        { status: 'SUBMITTED', date: '2025-08-10 09:30:00', actor: 'admin@safespace.com', note: 'Referral submitted via OCR processing from fax document', icon: <ClockIcon/> },
        { status: 'PENDING', date: '2025-08-10 09:31:00', actor: 'System', note: 'Referral queued for team leader review', icon: <ClockIcon/> },
        { status: 'IN REVIEW', date: '2025-08-10 10:00:00', actor: 'Eric Young', note: 'Team leader reviewing referral details', icon: <EyeIcon/> },
        { status: 'ACCEPTED', date: '2025-08-10 10:05:00', actor: 'Eric Young', note: 'Referral accepted and assigned to support worker', icon: <CheckCircleIcon/> },
    ]
};

// --- TIMELINE MODAL ---
/**
 * A modal component to display the detailed timeline of a referral's progress.
 * @param {object} props - The component props.
 * @param {object} props.data - The timeline data for the referral.
 * @param {Function} props.onClose - The function to call to close the modal.
 * @returns {JSX.Element} The TimelineModal component.
 */
const TimelineModal = ({ data, onClose }) => {
    /**
     * Returns a Tailwind CSS color class based on the event status for the status badge.
     * @param {string} status - The status of the timeline event.
     * @returns {string} The corresponding color class.
     */
    const getStatusColor = (status) => {
        switch (status) {
            case 'SUBMITTED': return 'bg-yellow-100 text-yellow-800';
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'IN REVIEW': return 'bg-blue-100 text-blue-800';
            case 'ACCEPTED': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    
    /**
     * Returns a Tailwind CSS color class based on the event status for the icon wrapper.
     * @param {string} status - The status of the timeline event.
     * @returns {string} The corresponding color class.
     */
    const getIconWrapperColor = (status) => {
        switch (status) {
            case 'SUBMITTED': return 'bg-yellow-200 text-yellow-800';
            case 'PENDING': return 'bg-yellow-200 text-yellow-800';
            case 'IN REVIEW': return 'bg-blue-200 text-blue-800';
            case 'ACCEPTED': return 'bg-green-200 text-green-800';
            default: return 'bg-gray-200 text-gray-800';
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl">
                <h2 className="text-2xl font-bold text-gray-800 text-center">Referral Timeline - {data.client}</h2>
                <p className="text-center text-gray-500 mb-6">Complete status history and processing timeline</p>
                {/* Summary of the referral */}
                <div className="text-sm space-y-2 mb-8 text-center bg-gray-50 p-4 rounded-lg">
                    <p><span className="font-semibold text-gray-600">Client:</span> {data.client}</p>
                    <p><span className="font-semibold text-gray-600">Submitted by:</span> {data.submittedBy}</p>
                    <p><span className="font-semibold text-gray-600">Current Status:</span> <span className={`px-2 py-1 rounded font-medium text-xs ${getStatusColor(data.status.toUpperCase())}`}>{data.status}</span></p>
                </div>
                
                {/* Vertical timeline */}
                <div className="relative pl-8">
                    {/* The vertical line connecting the timeline events */}
                    <div className="absolute left-8 top-1 bottom-1 w-0.5 bg-gray-200" aria-hidden="true"></div>
                    {data.events.map((event, index) => (
                        <div key={index} className="relative pl-8 mb-8">
                            {/* The icon for each timeline event */}
                            <div className="absolute left-0 top-0 transform -translate-x-1/2">
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center ring-8 ring-white ${getIconWrapperColor(event.status)}`}>{event.icon}</div>
                            </div>
                            {/* The content of each timeline event */}
                            <div className="pl-6">
                                <div className="flex items-center justify-between">
                                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${getStatusColor(event.status)}`}>{event.status}</span>
                                    <span className="text-xs text-gray-500">{event.date}</span>
                                </div>
                                <p className="text-sm font-semibold text-gray-700 mt-2">{event.actor}</p>
                                <div className="mt-2 p-3 bg-gray-100 rounded-md text-sm text-gray-600">
                                    {event.note}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <button onClick={onClose} className="w-full mt-6 bg-gray-200 text-gray-800 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-colors">Close</button>
            </div>
        </div>
    );
};


/**
 * The main page for tracking the status of referrals.
 * It displays a list of referrals with their current progress and provides options to search and filter them.
 * A modal can be opened to view the detailed timeline of a referral.
 * @returns {JSX.Element} The ReferralTrackingPage component.
 */
export default function ReferralTrackingPage() {
    // State to control the visibility of the timeline modal.
    const [showTimelineModal, setShowTimelineModal] = useState(false);

    /**
     * A component to visually track the progress of a referral through different stages.
     * @param {object} props - The component props.
     * @param {string[]} props.steps - An array of all possible steps in the process.
     * @param {string[]} props.currentProgress - An array of the steps that have been completed.
     * @returns {JSX.Element} The ProgressTracker component.
     */
    const ProgressTracker = ({ steps, currentProgress }) => {
        return (
            <div className="flex items-center gap-2 flex-wrap">
                {steps.map((step, index) => {
                    const isActive = currentProgress.includes(step);
                    return (
                        <React.Fragment key={step}>
                            <div className="flex items-center gap-1.5">
                                {isActive ? <CheckCircleIcon className="text-green-500" /> : <ClockIcon className="text-gray-400" />}
                                <span className={`text-sm ${isActive ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>{step}</span>
                            </div>
                            {/* Render an arrow between steps, but not after the last one. */}
                            {index < steps.length - 1 && <ArrowRightIcon />}
                        </React.Fragment>
                    );
                })}
            </div>
        );
    };

    return (
        <>
            <div className="bg-white p-8 rounded-2xl shadow-lg">
                <h1 className="text-xl font-bold text-gray-800">Referral Status Tracking</h1>
                <p className="text-gray-500 mb-6">Monitor the progress of all referrals from submission to completion</p>
                
                {/* Search and filter controls */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-grow">
                        <input type="text" placeholder="Search by client name or referral source" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"/>
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon /></div>
                    </div>
                    <div className="relative">
                         <select className="w-full md:w-auto appearance-none pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                            <option>All Status</option>
                            <option>Pending</option>
                            <option>In Review</option>
                            <option>Accepted</option>
                            <option>Declined</option>
                        </select>
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FilterIcon /></div>
                    </div>
                </div>

                {/* List of referrals */}
                <div className="space-y-4">
                    {referrals.map(ref => (
                        <div key={ref.id} className="bg-white p-6 rounded-lg border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800">{ref.name}</h3>
                                <p className="text-sm text-gray-500 mb-3">Age: {ref.age}</p>
                                <ProgressTracker steps={['Pending', 'In Review', 'Accepted']} currentProgress={ref.progress} />
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto mt-4 md:mt-0">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <CalendarIcon />
                                    <span>Submitted: {ref.submitted}</span>
                                </div>
                                {/* Button to open the timeline modal for this referral */}
                                <button onClick={() => setShowTimelineModal(true)} className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition-colors">View Timeline</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Conditionally render the timeline modal */}
            {showTimelineModal && <TimelineModal data={timelineData} onClose={() => setShowTimelineModal(false)} />}
        </>
    );
}