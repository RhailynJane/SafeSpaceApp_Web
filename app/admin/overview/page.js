// File path: app/admin/overview/page.js

// REFERENCES: Gemini Code Assist Agent / Gemini-Pro-2 

// REFERENCES: Gemini Code Assist Agent / Gemini-Pro-2 

// REFERENCES: Gemini Code Assist Agent / Gemini-Pro-2 

'use client';
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { X, Server, Database } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";

// --- ICONS ---
// These are simple, stateless functional components that render SVG icons.
// They are used to provide visual cues in the UI.

/**
 * Renders a server icon. This is a visual representation of a server.
 * @returns {JSX.Element} The server icon SVG.
 */
const ServerIcon = () => ( <Server className="h-5 w-5 text-gray-400" /> );

/**
 * Renders a database icon. This is a visual representation of a database.
 * @returns {JSX.Element} The database icon SVG.
 */
const DatabaseIcon = () => ( <Database className="h-5 w-5 text-gray-400" /> );

/**
 * Renders a close icon (an 'X'). Used for closing modals or dismissing elements.
 * @returns {JSX.Element} The close icon SVG.
 */
const CloseIcon = () => ( <X className="h-5 w-5 text-gray-500 hover:text-gray-800" /> );

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

const DetailedMetricsModal = ({ onClose }) => {
    const [metrics, setMetrics] = useState({ totalUsers: 0 });
    const [databaseStatus, setDatabaseStatus] = useState('checking');
    const [clerkStatus, setClerkStatus] = useState('checking');
    const [apiResponseTime, setApiResponseTime] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/admin/metrics');
                if (response.status === 403) {
                    setError('Unauthorized to fetch metrics.');
                    setMetrics({ totalUsers: 0 }); // Set default values
                    return;
                }
                if (!response.ok) {
                    throw new Error('Failed to fetch metrics');
                } 
                const data = await response.json();
                setMetrics(data);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        const fetchDatabaseHealth = async () => {
            try {
                const response = await fetch('/api/admin/database-health');
                const data = await response.json();
                setDatabaseStatus(data.status);
            } catch (error) {
                setDatabaseStatus('error');
            }
        };

        const fetchClerkHealth = async () => {
            try {
                const response = await fetch('/api/admin/clerk-health');
                const data = await response.json();
                setClerkStatus(data.status);
            } catch (error) {
                console.error('Error fetching Clerk Health:', error);
                setClerkStatus('error');
            }
        };

        const fetchApiResponseTime = async () => {
            try {
                const startTime = Date.now();
                await fetch('/api/admin/ping');
                const endTime = Date.now();
                setApiResponseTime(endTime - startTime);
            } catch (error) {
                setApiResponseTime(-1);
            }
        };

        fetchMetrics();
        fetchDatabaseHealth();
        fetchClerkHealth();
        fetchApiResponseTime();
    }, []);

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
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Detailed System Metrics</DialogTitle>
                    <DialogDescription>
                        {/* Optional: Add a description if needed */}
                    </DialogDescription>
                </DialogHeader>
                {/* Grid of metric bars */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loading && <p>Loading...</p>}
                    {error && <p className="text-red-500">{error}</p>}
                    {!loading && !error && (
                        <>
                            <MetricBar label="Database Status" value={databaseStatus} threshold="" percentage={databaseStatus === 'ok' ? 100 : 0} status={databaseStatus === 'ok' ? 'normal' : 'error'} />
                            <MetricBar label="Clerk.js Status" value={clerkStatus} threshold="" percentage={clerkStatus === 'connected' ? 100 : 0} status={clerkStatus === 'connected' ? 'normal' : 'error'} />
                            <MetricBar label="Users" value={`${metrics.totalUsers} users`} threshold="5000 users" percentage={(metrics.totalUsers / 5000) * 100} />
                            <MetricBar label="API Response Time" value={`${apiResponseTime} ms`} threshold="1000 ms" percentage={Math.min(100, (apiResponseTime / 1000) * 100)} status={apiResponseTime > 1000 ? 'error' : 'normal'} />
                        </>
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const AuditLogModal = ({ onClose }) => {
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAuditLogs = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/admin/audit-logs');
                if (!response.ok) {
                    throw new Error('Failed to fetch audit logs');
                }
                const data = await response.json();
                setAuditLogs(data);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAuditLogs();
    }, []);

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="w-full max-w-3xl h-3/4 overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Full Audit Log</DialogTitle>
                    <DialogDescription>
                        {/* Optional: Add a description if needed */}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    {loading && <p>Loading...</p>}
                    {error && <p className="text-red-500">{error}</p>}
                    {!loading && !error && auditLogs.map(log => (
                        <div key={log.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                            <p className="font-semibold text-gray-800">[{log.type === 'alert' ? 'ALERT' : 'AUDIT'}] {log.action} {log.type === 'audit' ? `by ${log.user}` : ''}</p>
                            <p className="text-sm text-gray-500">{log.details}</p>
                            <p className="text-xs text-gray-400 mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <Button onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
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
    const [totalUsers, setTotalUsers] = useState(0);
    const [recentActivities, setRecentActivities] = useState([]);
    const [systemUptime, setSystemUptime] = useState('0.0%');
    const [securityAlerts, setSecurityAlerts] = useState(0);
    const [activeSessions, setActiveSessions] = useState(0);

    useEffect(() => {
        const fetchTotalUsers = async () => {
            try {
                const response = await fetch('/api/admin/metrics');
                if (response.status === 403) {
                    console.error('Unauthorized to fetch total users.');
                    setTotalUsers(0); // Set to 0 on unauthorized access
                    return;
                }
                if (!response.ok) {
                    throw new Error('Failed to fetch total users');
                }
                const data = await response.json();
                setTotalUsers(data.totalUsers);
            } catch (error) {
                console.error(error);
                setTotalUsers(0); // Set to 0 on error to prevent undefined issues
            }
        };

        const fetchRecentActivities = async () => {
            try {
                const response = await fetch('/api/admin/audit-logs?limit=2');
                if (response.status === 403) {
                    console.error('Unauthorized to fetch recent activities.');
                    setRecentActivities([]); // Set to empty array on unauthorized access
                    return;
                }
                if (!response.ok) {
                    throw new Error('Failed to fetch recent activities');
                }
                const data = await response.json();
                setRecentActivities(data);
            } catch (error) {
                console.error(error);
                setRecentActivities([]); // Set to empty array on error
            }
        };

        const fetchSystemUptime = async () => {
            try {
                const response = await fetch('/api/admin/system-uptime');
                if (response.status === 403) {
                    console.error('Unauthorized to fetch system uptime.');
                    setSystemUptime('N/A'); // Set to N/A on unauthorized access
                    return;
                }
                if (!response.ok) {
                    throw new Error('Failed to fetch system uptime');
                }
                const data = await response.json();
                setSystemUptime(data.uptime);
            } catch (error) {
                console.error(error);
                setSystemUptime('N/A'); // Set to N/A on error
            }
        };

        const fetchSecurityAlerts = async () => {
            try {
                const response = await fetch('/api/admin/security-alerts');
                if (response.status === 403) {
                    console.error('Unauthorized to fetch security alerts.');
                    setSecurityAlerts(0); // Set to 0 on unauthorized access
                    return;
                }
                if (!response.ok) {
                    throw new Error('Failed to fetch security alerts');
                }
                const data = await response.json();
                setSecurityAlerts(data.unreadAlerts);
            } catch (error) {
                console.error(error);
                setSecurityAlerts(0); // Set to 0 on error
            }
        };

        const fetchActiveSessions = async () => {
            try {
                const response = await fetch('/api/admin/active-sessions');
                if (response.status === 403) {
                    console.error('Unauthorized to fetch active sessions.');
                    setActiveSessions(0); // Set to 0 on unauthorized access
                    return;
                }
                if (!response.ok) {
                    throw new Error('Failed to fetch active sessions');
                }
                const data = await response.json();
                setActiveSessions(data.activeSessions);
            } catch (error) {
                console.error(error);
                setActiveSessions(0); // Set to 0 on error to prevent undefined issues
            }
        };

        fetchTotalUsers();
        fetchRecentActivities();
        fetchSystemUptime();
        fetchSecurityAlerts();
        fetchActiveSessions();
    }, []);

    return (
        <>
            <div className="space-y-8">
                {/* Page Header */}
                <h1 className="text-2xl font-bold text-gray-800">Welcome, Admin!</h1>

                {/* Section for key statistics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Total Users" value={totalUsers} />
                    <StatCard title="System Uptime" value={systemUptime} />
                    <StatCard title="Security Alerts" value={securityAlerts} />
                    <StatCard title="Active Sessions" value={activeSessions} />
                </div>

                {/* Section for system health overview */}
                <div className="bg-teal-50/50 border border-teal-100 p-6 rounded-2xl">
                    <h2 className="font-bold text-lg text-gray-800 mb-4">System Health Overview</h2>
                    <div className="flex flex-col md:flex-row gap-6 mb-6">
                        <HealthCard title="Server Status" status="Online" value="99.9% uptime" icon={<ServerIcon />} />
                        <HealthCard title="Database" status="Healthy" value="120 ms avg response" statusColor="text-blue-500" icon={<DatabaseIcon />} />
                    </div>
                    {/* Button to open the detailed metrics modal */}
                    <Button 
                        onClick={() => setShowMetricsModal(true)}
                        className="w-full"
                    >
                        View Detailed Metrics
                    </Button>
                </div>

                {/* Section for recent admin activities */}
                <div className="bg-gray-50 border border-gray-100 p-6 rounded-2xl">
                    <h2 className="font-bold text-lg text-gray-800 mb-4">Recent Admin Activities</h2>
                    <div className="space-y-4 mb-6">
                        {recentActivities.map(activity => (
                            <ActivityItem key={activity.id} title={activity.action} description={activity.details} time={new Date(activity.timestamp).toLocaleString()} />
                        ))}
                    </div>
                    {/* Button to open the full audit log modal */}
                    <Button 
                        onClick={() => setShowAuditLogModal(true)}
                        className="w-full"
                    >View Full Audit Log</Button>
                </div>
            </div>

            {/* Conditionally render the modals based on their state */}
            {showMetricsModal && <DetailedMetricsModal onClose={() => setShowMetricsModal(false)} />}
            {showAuditLogModal && <AuditLogModal onClose={() => setShowAuditLogModal(false)} />}
        </>
    );
}
