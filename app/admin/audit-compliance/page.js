'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
// REFERENCES: Gemini Code Assist Agent / Gemini-Pro-2 


// REFERENCES: Gemini Code Assist Agent / Gemini-Pro-2 

// --- STAT CARD COMPONENT ---
/**
 * A reusable card component to display a key statistic with a title, value, and subtitle.
 * The color of the value can be customized.
 * @param {object} props - The component props.
 * @param {string} props.title - The title of the statistic (e.g., "Security Score").
 * @param {string} props.value - The main value of the statistic (e.g., "98%").
 * @param {string} props.subtitle - A subtitle providing additional context (e.g., "Last audit: 2 days ago").
 * @param {string} [props.valueColor='text-gray-900'] - The Tailwind CSS class for the color of the value.
 * @returns {JSX.Element} The StatCard component.
 */
const StatCard = ({ title, value, subtitle, valueColor = 'text-gray-900' }) => (
    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className={`text-4xl font-bold mt-2 ${valueColor}`}>{value}</p>
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
);


/**
 * The main page for the Audit & Compliance dashboard.
 * This page provides a high-level overview of security and compliance metrics,
 * as well as a list of recent audit events.
 * @returns {JSX.Element} The AuditCompliancePage component.
 */
export default function AuditCompliancePage() {
    const [auditEvents, setAuditEvents] = useState([]);
    const [activeAlerts, setActiveAlerts] = useState(0);
    const [securityScore, setSecurityScore] = useState('N/A');
    const [complianceStatus, setComplianceStatus] = useState('N/A');

    useEffect(() => {
        const getAuditEvents = async () => {
            const res = await fetch('/api/admin/audit-logs');
            const data = await res.json();
            setAuditEvents(data || []);
        };

        const fetchActiveAlerts = async () => {
            try {
                const response = await fetch('/api/admin/security-alerts');
                if (response.status === 403) {
                    console.error('Unauthorized to fetch security alerts.');
                    setActiveAlerts(0);
                    return;
                }
                if (!response.ok) {
                    throw new Error('Failed to fetch security alerts');
                }
                const data = await response.json();
                setActiveAlerts(data.unreadAlerts);
            } catch (error) {
                console.error(error);
                setActiveAlerts(0);
            }
        };

        getAuditEvents();
        fetchActiveAlerts();
    }, []);

    return (
        <div className="space-y-8">
            {/* Header section with the main title and a brief description of the page. */}
            <div className="bg-white p-6 rounded-2xl shadow-lg">
                <h2 className="text-lg font-bold text-gray-800 mb-1">Audit & Compliance Dashboard</h2>
                <p className="text-sm text-gray-500 mb-6">Monitor system access, security events, and compliance metrics</p>
                
                {/* Grid of key statistics using the StatCard component. */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Security Score</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold mt-2 text-blue-600">{securityScore}</p>
                            <p className="text-xs text-gray-500 mt-1">Last audit: N/A</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Active Alerts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold mt-2 text-yellow-600">{activeAlerts}</p>
                            <p className="text-xs text-gray-500 mt-1">Requires attention</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Compliance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold mt-2 text-green-600">{complianceStatus}</p>
                            <p className="text-xs text-gray-500 mt-1">All requirements met</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
            
            {/* Section to display recent audit events. */}
            <div className="bg-white p-6 rounded-2xl shadow-lg">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Audit Events</h2>
                <div className="space-y-4">
                    {/* Map over the auditEvents mock data to render each event in a list. */}
                    {auditEvents.map(event => (
                        <div key={event.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-gray-800">[{event.type === 'alert' ? 'ALERT' : 'AUDIT'}] {event.action}</p>
                                <p className="text-sm text-gray-600">{event.details}</p>
                            </div>
                            <p className="text-sm text-gray-500">{new Date(event.timestamp).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}