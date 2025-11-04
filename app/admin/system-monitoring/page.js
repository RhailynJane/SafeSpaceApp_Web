'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// REFERENCES: Gemini Code Assist Agent / Gemini-Pro-2 

/**
 * The main page for monitoring system health and alerts.
 * This page displays a high-level overview of system health metrics like uptime and response time,
 * as well as a list of recent system alerts.
 * @returns {JSX.Element} The SystemMonitoringPage component.
 */
export default function SystemMonitoringPage() {
    const [systemAlerts, setSystemAlerts] = useState([]);
    const [systemUptime, setSystemUptime] = useState('N/A');
    const [apiResponseTime, setApiResponseTime] = useState(0);

    useEffect(() => {
        const getSystemAlerts = async () => {
            const res = await fetch('/api/admin/system-alerts');
            const data = await res.json();
            setSystemAlerts(data.alerts || []);
        };

        const fetchSystemUptime = async () => {
            try {
                const response = await fetch('/api/admin/system-uptime');
                if (response.status === 403) {
                    console.error('Unauthorized to fetch system uptime.');
                    setSystemUptime('N/A');
                    return;
                }
                if (!response.ok) {
                    throw new Error('Failed to fetch system uptime');
                }
                const data = await response.json();
                setSystemUptime(data.uptime);
            } catch (error) {
                console.error(error);
                setSystemUptime('N/A');
            }
        };

        const fetchApiResponseTime = async () => {
            try {
                const startTime = Date.now();
                const response = await fetch('/api/admin/ping');
                if (response.status === 403) {
                    console.error('Unauthorized to fetch API response time.');
                    setApiResponseTime(-1);
                    return;
                }
                if (!response.ok) {
                    throw new Error('Failed to fetch API response time');
                }
                const endTime = Date.now();
                setApiResponseTime(endTime - startTime);
            } catch (error) {
                console.error(error);
                setApiResponseTime(-1);
            }
        };

        getSystemAlerts();
        fetchSystemUptime();
        fetchApiResponseTime();
    }, []);

    /**
     * Returns a Tailwind CSS class for the border color of an alert based on its type.
     * This is used to visually distinguish different types of alerts (e.g., warnings).
     * @param {string} type - The type of the alert (e.g., 'warning', 'success').
     * @returns {string} The corresponding Tailwind CSS class for the border color.
     */
    const getAlertColor = (type) => {
        switch (type) {
            case 'warning': return 'border-l-4 border-yellow-500';
            case 'error': return 'border-l-4 border-red-500';
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
                    <Card>
                        <CardHeader>
                            <CardTitle>System Uptime</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold text-green-600 mt-2">{systemUptime}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Response Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold text-blue-600 mt-2">{apiResponseTime} ms</p>
                        </CardContent>
                    </Card>
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
                            <div>
                                <Badge variant={alert.type === 'error' ? 'destructive' : 'default'}>{alert.type}</Badge>
                                <p className="text-gray-800 mt-2">{alert.message}</p>
                            </div>
                            <p className="text-sm text-gray-500">{new Date(alert.timestamp).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}