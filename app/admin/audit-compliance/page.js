import React from 'react';
// REFERENCES: Gemini Code Assist Agent / Gemini-Pro-2 


// --- MOCK DATA ---
// This is mock data for recent audit events. In a real application, this would be fetched from an API.
const auditEvents = [
    { id: 1, event: 'User Created', description: 'Created new support worker account', timestamp: '2025-08-10 09:00:00' },
    { id: 2, event: 'Client Access', description: 'Accessed client profile for Emma Wilson', timestamp: '2025-08-10 09:00:00' },
    { id: 3, event: 'Security Alert', description: 'Multiple failed login attempts detected', timestamp: '2025-08-10 09:30:00' },
];

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
    return (
        <div className="space-y-8">
            {/* Header section with the main title and a brief description of the page. */}
            <div className="bg-white p-6 rounded-2xl shadow-lg">
                <h2 className="text-lg font-bold text-gray-800 mb-1">Audit & Compliance Dashboard</h2>
                <p className="text-sm text-gray-500 mb-6">Monitor system access, security events, and compliance metrics</p>
                
                {/* Grid of key statistics using the StatCard component. */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="Security Score" value="98%" subtitle="Last audit: 2 days ago" valueColor="text-blue-600" />
                    <StatCard title="Active Alerts" value="1" subtitle="Requires attention" valueColor="text-yellow-600" />
                    <StatCard title="Compliance" value="100%" subtitle="All requirements met" valueColor="text-green-600" />
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
                                <p className="font-semibold text-gray-800">{event.event}</p>
                                <p className="text-sm text-gray-600">{event.description}</p>
                            </div>
                            <p className="text-sm text-gray-500">{event.timestamp}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}