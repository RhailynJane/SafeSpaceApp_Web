// File path: app/(admin)/overview/page.js

'use client';
import React, { useState } from 'react';

// --- ICONS ---
// These are simple, stateless functional components that render SVG icons.
// They are used to provide visual cues in the UI.

/**
 * Renders a server icon. This is a visual representation of a server.
 * @returns {JSX.Element} The server icon SVG.
 */
const ServerIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg> );

/**
 * Renders a database icon. This is a visual representation of a database.
 * @returns {JSX.Element} The database icon SVG.
 */
const DatabaseIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg> );

/**
 * Renders a close icon (an 'X'). Used for closing modals or dismissing elements.
 * @returns {JSX.Element} The close icon SVG.
 */
const CloseIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 hover:text-gray-800"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> );

// --- MOCK DATA & REUSABLE UI COMPONENTS ---
// These components are used to build the UI of the overview page.
// They are designed to be reusable and are styled using Tailwind CSS.

/**
 * A card component to display a single, important statistic.
 * It shows a title and a value in a visually distinct card.
 * @param {object} props - The component props.
 * @param {string} props.title - The title of the statistic (e.g., "Total Users").
 * @param {string} props.value - The value of the statistic (e.g., "200").
 * @returns {JSX.Element} The StatCard component.
 */
const StatCard = ({ title, value }) => (
    <div className="bg-white p-6 rounded-2xl shadow-md text-center">
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-4xl font-bold text-gray-800 mt-2">{value}</p>
    </div>
);

/**
 * A card component to display the health status of a system component.
 * It includes a title, status, a descriptive value, and an icon.
 * The status color can be customized.
 * @param {object} props - The component props.
 * @param {string} props.title - The title of the health metric (e.g., "Server Status").
 * @param {string} props.status - The current status (e.g., "Online").
 * @param {string} props.value - A descriptive value (e.g., "99.9% uptime").
 * @param {string} [props.statusColor='text-green-500'] - The Tailwind CSS class for the status text color.
 * @param {JSX.Element} props.icon - The icon to display in the card.
 * @returns {JSX.Element} The HealthCard component.
 */
const HealthCard = ({ title, status, value, statusColor = 'text-green-500', icon }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm flex-1">
        <div className="flex justify-between items-start">
            <p className="text-gray-500 text-sm">{title}</p>
            {icon}
        </div>
        <p className={`text-2xl font-bold ${statusColor} mt-2`}>{status}</p>
        <p className="text-xs text-gray-400">{value}</p>
    </div>
);

/**
 * An item component to display a single recent activity in a list.
 * It shows a title, description, and timestamp for the activity.
 * @param {object} props - The component props.
 * @param {string} props.title - The title of the activity (e.g., "User Created").
 * @param {string} props.description - A short description of the activity.
 * @param {string} props.time - The timestamp of the activity.
 * @returns {JSX.Element} The ActivityItem component.
 */
const ActivityItem = ({ title, description, time }) => (
    <div className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center">
        <div>
            <p className="font-semibold text-gray-800">{title}</p>
            <p className="text-sm text-gray-500">{description}</p>
            <p className="text-xs text-gray-400 mt-1">{time}</p>
        </div>
        <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">info</span>
    </div>
);

/**
 * A modal component that displays detailed system metrics.
 * This modal appears as an overlay on the page.
 * @param {object} props - The component props.
 * @param {Function} props.onClose - The function to call to close the modal.
 * @returns {JSX.Element} The DetailedMetricsModal component.
 */
const DetailedMetricsModal = ({ onClose }) => {
    /**
     * A component to display a single metric with a progress bar, value, and threshold.
     * Used inside the DetailedMetricsModal.
     * @param {object} props - The component props.
     * @param {string} props.label - The label for the metric (e.g., "CPU Usage").
     * @param {string} props.value - The current value of the metric (e.g., "45%").
     * @param {string} props.threshold - The acceptable threshold for the metric (e.g., "80%").
     * @param {number} props.percentage - The percentage value to determine the width of the progress bar.
     * @param {string} [props.status='normal'] - The status of the metric, which affects the color of the status indicator.
     * @returns {JSX.Element} The MetricBar component.
     */
    const MetricBar = ({ label, value, threshold, percentage, status = "normal" }) => (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            {/* Header with label and status */}
            <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-semibold text-gray-700">{label}</p>
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${status === 'normal' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>{status}</span>
            </div>
            {/* Current value */}
            <p className="text-2xl font-bold text-gray-800 mb-2">{value}</p>
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
            </div>
            {/* Threshold information */}
            <p className="text-right text-xs text-gray-500 mt-1">Threshold: {threshold}</p>
        </div>
    );

    return (
        // Modal container with a semi-transparent background
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            {/* Modal content */}
            <div className="bg-gray-50 p-6 rounded-2xl shadow-xl w-full max-w-3xl">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Detailed System Metrics</h2>
                    <button onClick={onClose}><CloseIcon /></button>
                </div>
                {/* Grid of metric bars */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <MetricBar label="CPU Usage" value="45%" threshold="80%" percentage={45} />
                    <MetricBar label="Memory Usage" value="67%" threshold="85%" percentage={67} />
                    <MetricBar label="Database Response Time" value="120 ms" threshold="500 ms" percentage={24} />
                    <MetricBar label="Users" value="200 users" threshold="5000 users" percentage={4} />
                    <MetricBar label="API Response Time" value="350 ms" threshold="1000 ms" percentage={35} />
                    <MetricBar label="Error Rate" value="0.99%" threshold="5%" percentage={19.8} />
                </div>
            </div>
        </div>
    );
};

// This is mock data for the audit log. In a real application, this would be fetched from an API.
const fullAuditLogData = [
    { id: 1, action: "User Login", user: "admin@safespace.com", timestamp: "2025-08-11 14:30:00", details: "Successful login from IP: 192.168.1.100" },
    { id: 2, action: "User Created", user: "admin@safespace.com", timestamp: "2025-08-11 14:35:15", details: "New user 'John Doe' (john.doe@example.com) created." },
    { id: 3, action: "Client Profile Access", user: "therapist@safespace.com", timestamp: "2025-08-11 11:30:34", details: "Accessed client profile for Emma Wilson." },
    { id: 4, action: "Data Export", user: "admin@safespace.com", timestamp: "2025-08-10 09:00:00", details: "Exported user data to CSV." },
    { id: 5, action: "Password Change", user: "user@safespace.com", timestamp: "2025-08-09 18:00:00", details: "User changed their password." },
];

/**
 * A modal component to display the full audit log.
 * This modal is scrollable to accommodate a long list of log entries.
 * @param {object} props - The component props.
 * @param {Function} props.onClose - The function to call to close the modal.
 * @returns {JSX.Element} The AuditLogModal component.
 */
const AuditLogModal = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-50 p-6 rounded-2xl shadow-xl w-full max-w-3xl h-3/4 overflow-y-auto">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Full Audit Log</h2>
                    <button onClick={onClose}><CloseIcon /></button>
                </div>
                {/* Container for the list of log items */}
                <div className="space-y-4">
                    {/* Map over the mock data to render each log entry */}
                    {fullAuditLogData.map(log => (
                        <div key={log.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                            <p className="font-semibold text-gray-800">{log.action} by {log.user}</p>
                            <p className="text-sm text-gray-500">{log.details}</p>
                            <p className="text-xs text-gray-400 mt-1">{log.timestamp}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


/**
 * The main overview page for the admin dashboard.
 * This component brings together all the smaller components to create the dashboard layout.
 * It displays high-level statistics, system health, and recent admin activities.
 * @returns {JSX.Element} The OverviewPage component.
 */
export default function OverviewPage() {
    // State to control the visibility of the detailed metrics modal.
    const [showMetricsModal, setShowMetricsModal] = useState(false);
    // State to control the visibility of the full audit log modal.
    const [showAuditLogModal, setShowAuditLogModal] = useState(false);

    return (
        <>
            <div className="space-y-8">
                {/* Page Header */}
                <h1 className="text-2xl font-bold text-gray-800">Welcome, Admin!</h1>

                {/* Section for key statistics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Total Users" value="200" />
                    <StatCard title="System Uptime" value="99.9%" />
                    <StatCard title="Security Alerts" value="3" />
                    <StatCard title="Active Sessions" value="89" />
                </div>

                {/* Section for system health overview */}
                <div className="bg-teal-50/50 border border-teal-100 p-6 rounded-2xl">
                    <h2 className="font-bold text-lg text-gray-800 mb-4">System Health Overview</h2>
                    <div className="flex flex-col md:flex-row gap-6 mb-6">
                        <HealthCard title="Server Status" status="Online" value="99.9% uptime" icon={<ServerIcon />} />
                        <HealthCard title="Database" status="Healthy" value="120 ms avg response" statusColor="text-blue-500" icon={<DatabaseIcon />} />
                    </div>
                    {/* Button to open the detailed metrics modal */}
                    <button 
                        onClick={() => setShowMetricsModal(true)}
                        className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        View Detailed Metrics
                    </button>
                </div>

                {/* Section for recent admin activities */}
                <div className="bg-gray-50 border border-gray-100 p-6 rounded-2xl">
                    <h2 className="font-bold text-lg text-gray-800 mb-4">Recent Admin Activities</h2>
                    <div className="space-y-4 mb-6">
                        <ActivityItem title="User Created" description="Created a new support worker" time="2025-08-11 14:30:00" />
                        <ActivityItem title="Client Access" description="Access client profile for Emma Wilson" time="2025-08-11 11:30:34" />
                    </div>
                    {/* Button to open the full audit log modal */}
                    <button 
                        onClick={() => setShowAuditLogModal(true)}
                        className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                    >View Full Audit Log</button>
                </div>
            </div>

            {/* Conditionally render the modals based on their state */}
            {showMetricsModal && <DetailedMetricsModal onClose={() => setShowMetricsModal(false)} />}
            {showAuditLogModal && <AuditLogModal onClose={() => setShowAuditLogModal(false)} />}
        </>
    );
}