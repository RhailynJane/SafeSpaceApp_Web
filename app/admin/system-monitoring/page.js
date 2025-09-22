import React from 'react';

// REFERENCES: Gemini Code Assist Agent / Gemini-Pro-2 

// --- MOCK DATA ---
// This is mock data for system alerts. In a real application, this would be fetched from a monitoring service or a logging system.
const systemAlerts = [
    { id: 1, message: 'Database backup completed successfully', timestamp: '2 hours ago', type: 'success' },
    { id: 2, message: 'High memory usage detected on server 2', timestamp: '4 hours ago', type: 'warning' },
    { id: 3, message: 'Security patch applied successfully', timestamp: '1 day ago', type: 'success' },
];

/**
 * The main page for monitoring system health and alerts.
 * This page displays a high-level overview of system health metrics like uptime and response time,
 * as well as a list of recent system alerts.
 * @returns {JSX.Element} The SystemMonitoringPage component.
 */
export default function SystemMonitoringPage() {
    /**
     * Returns a Tailwind CSS class for the border color of an alert based on its type.
     * This is used to visually distinguish different types of alerts (e.g., warnings).
     * @param {string} type - The type of the alert (e.g., 'warning', 'success').
     * @returns {string} The corresponding Tailwind CSS class for the border color.
     */
    const getAlertColor = (type) => {
        switch (type) {
            case 'warning': return 'border-l-4 border-yellow-500';
            default: return 'border-l-4 border-gray-300';
        }
    };

    return (
        <div className="space-y-8">
            {/* System Health Overview Section */}
            <div className="bg-white p-6 rounded-2xl shadow-lg">
                <h2 className="text-lg font-bold text-gray-800 mb-1">System Health Overview</h2>
                <p className="text-sm text-gray-500 mb-6">Monitor system performance and health metrics</p>
                {/* Grid for displaying key health metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Uptime metric */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-center">
                        <p className="text-sm font-medium text-gray-600">System Uptime</p>
                        <p className="text-4xl font-bold text-green-600 mt-2">99.9%</p>
                    </div>
                    {/* Response time metric */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-center">
                        <p className="text-sm font-medium text-gray-600">Response Time</p>
                        <p className="text-4xl font-bold text-blue-600 mt-2">235 ms</p>
                    </div>
                </div>
            </div>

            {/* System Alerts Section */}
            <div className="bg-white p-6 rounded-2xl shadow-lg">
                <h2 className="text-lg font-bold text-gray-800 mb-1">System Alerts</h2>
                <p className="text-sm text-gray-500 mb-6">Recent system notifications and alerts</p>
                {/* List of system alerts */}
                <div className="space-y-4">
                    {/* Map over the systemAlerts mock data to render each alert */}
                    {systemAlerts.map(alert => (
                        <div key={alert.id} className={`bg-gray-50 p-4 rounded-lg border ${getAlertColor(alert.type)} flex justify-between items-center`}>
                            <p className="text-gray-800">{alert.message}</p>
                            <p className="text-sm text-gray-500">{alert.timestamp}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}