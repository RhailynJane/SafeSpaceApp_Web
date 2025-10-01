'use client';
import React, { useState, useEffect } from 'react';

// REFERENCES: Gemini Code Assist Agent / Gemini-Pro-2 

// --- ICONS ---
// A collection of simple, stateless functional components for rendering SVG icons.

/** Renders a chart icon. */
const ChartIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg> );
/** Renders a users icon. */
const UsersIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> );
/** Renders a shield icon for security reports. */
const ShieldIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> );
/** Renders a file icon for compliance reports. */
const FileIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg> );

// --- COMPONENTS ---

/**
 * A card component for displaying a single analytics metric.
 * @param {object} props - The component props.
 * @param {string} props.title - The title of the metric.
 * @param {string} props.value - The value of the metric.
 * @param {string} props.subtitle - A subtitle with additional context.
 * @param {string} props.valueColor - The Tailwind CSS class for the color of the value.
 * @returns {JSX.Element} The AnalyticsCard component.
 */
const AnalyticsCard = ({ title, value, subtitle, valueColor }) => (
    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className={`text-3xl font-bold mt-2 ${valueColor}`}>{value}</p>
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
);

/**
 * The main page for the Reports & Analytics dashboard.
 * It displays key analytics metrics and provides buttons to generate various reports.
 * The report content is displayed in a modal.
 * @returns {JSX.Element} The ReportsAnalyticsPage component.
 */
export default function ReportsAnalyticsPage() {
    const [reports, setReports] = useState([]);

    useEffect(() => {
        const getReports = async () => {
            const res = await fetch('/api/admin/reports');
            const data = await res.json();
            setReports(data);
        };
        getReports();
    }, []);

    return (
        <div className="bg-white p-8 rounded-2xl shadow-lg">
            {/* Page Header */}
            <h2 className="text-lg font-bold text-gray-800 mb-1">Reports & Analytics Dashboard</h2>
            <p className="text-sm text-gray-500 mb-6">Generate comprehensive reports and view platform analytics</p>

            {/* Analytics Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <AnalyticsCard title="Platform Growth" value="+ 15%" subtitle="This month" valueColor="text-green-600" />
                <AnalyticsCard title="Active Users" value="200" subtitle="Daily average" valueColor="text-blue-600" />
                <AnalyticsCard title="Session Duration" value="45 m" subtitle="Average" valueColor="text-blue-600" />
            </div>

            {/* Reports Table Section */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-teal-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-teal-800 uppercase tracking-wider">Report Name</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-teal-800 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-teal-800 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-teal-800 uppercase tracking-wider">Size (MB)</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {reports.map(report => (
                            <tr key={report.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{report.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(report.report_date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.type}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.size_mb}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}