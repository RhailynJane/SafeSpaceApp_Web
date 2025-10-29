'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LineChart, Users, Shield, FileText } from "lucide-react";

// REFERENCES: Gemini Code Assist Agent / Gemini-Pro-2 

// --- ICONS ---
// A collection of simple, stateless functional components for rendering SVG icons.

/** Renders a chart icon. */
const ChartIcon = () => ( <LineChart className="h-6 w-6 text-gray-400" /> );
/** Renders a users icon. */
const UsersIcon = () => ( <Users className="h-6 w-6 text-gray-400" /> );
/** Renders a shield icon for security reports. */
const ShieldIcon = () => ( <Shield className="h-6 w-6 text-gray-400" /> );
/** Renders a file icon for compliance reports. */
const FileIcon = () => ( <FileText className="h-6 w-6 text-gray-400" /> );

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
    const [platformGrowth, setPlatformGrowth] = useState('N/A');
    const [activeUsers, setActiveUsers] = useState(0);
    const [sessionDuration, setSessionDuration] = useState('N/A');

    useEffect(() => {
        const getReports = async () => {
            const res = await fetch('/api/admin/reports');
            const data = await res.json();
            setReports(data.reports || []);
        };

        const fetchPlatformMetrics = async () => {
            try {
                const response = await fetch('/api/admin/metrics');
                if (response.status === 403) {
                    console.error('Unauthorized to fetch platform metrics.');
                    setActiveUsers(0);
                    setPlatformGrowth('N/A');
                    setSessionDuration('N/A');
                    return;
                }
                if (!response.ok) {
                    throw new Error('Failed to fetch platform metrics');
                }
                const data = await response.json();
                setActiveUsers(data.totalUsers);
                // For now, platformGrowth and sessionDuration remain N/A as there are no specific APIs for them.
            } catch (error) {
                console.error(error);
                setActiveUsers(0);
                setPlatformGrowth('N/A');
                setSessionDuration('N/A');
            }
        };

        getReports();
        fetchPlatformMetrics();
    }, []);

    return (
        <div className="bg-white p-8 rounded-2xl shadow-lg">
            {/* Page Header */}
            <h2 className="text-lg font-bold text-gray-800 mb-1">Reports & Analytics Dashboard</h2>
            <p className="text-sm text-gray-500 mb-6">Generate comprehensive reports and view platform analytics</p>

            {/* Analytics Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <Card>
                    <CardHeader>
                        <CardTitle>Platform Growth</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold mt-2 text-green-600">{platformGrowth}</p>
                        <p className="text-xs text-gray-500 mt-1">This month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Active Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold mt-2 text-blue-600">{activeUsers}</p>
                        <p className="text-xs text-gray-500 mt-1">Daily average</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Session Duration</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold mt-2 text-blue-600">{sessionDuration}</p>
                        <p className="text-xs text-gray-500 mt-1">Average</p>
                    </CardContent>
                </Card>
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