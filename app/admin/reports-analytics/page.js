'use client';
import React, { useState } from 'react';

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

// --- MOCK DATA ---
// This mock data simulates the content of different reports that can be generated.
// In a real application, this content would likely be generated on the fly or fetched from a reporting service.
const reportMockData = {
    "Platform Usage Report": {
        title: "Platform Usage Summary",
        content: "This report provides an overview of platform usage, including daily active users, session durations, and feature engagement. Data covers the last 30 days."
    },
    "User Activity Report": {
        title: "User Activity Overview",
        content: "Detailed insights into user logins, feature interactions, and common pathways within the application. Data is aggregated weekly."
    },
    "Security Audit Report": {
        title: "Security Audit Findings",
        content: "Summary of recent security scans, vulnerability assessments, and compliance checks. Includes a list of resolved and pending issues."
    },
    "Compliance Report": {
        title: "Regulatory Compliance Status",
        content: "Report on adherence to relevant industry regulations and internal compliance policies. Highlights areas of full compliance and areas requiring attention."
    }
};

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
 * A button component for triggering the generation or display of a report.
 * @param {object} props - The component props.
 * @param {string} props.title - The title of the report.
 * @param {JSX.Element} props.icon - The icon to display on the button.
 * @param {Function} props.onClick - The function to call when the button is clicked.
 * @returns {JSX.Element} The ReportButton component.
 */
const ReportButton = ({ title, icon, onClick }) => (
    <button onClick={onClick} className="w-full flex items-center gap-4 p-6 bg-white border-2 border-gray-300 border-dashed rounded-xl hover:border-teal-500 hover:bg-teal-50 transition-all text-left">
        <div className="text-gray-500">{icon}</div>
        <span className="text-lg font-semibold text-gray-700">{title}</span>
    </button>
);

/**
 * A modal component to display the content of a generated report.
 * @param {object} props - The component props.
 * @param {string} props.title - The title of the report.
 * @param {string} props.content - The content of the report.
 * @param {Function} props.onClose - The function to call to close the modal.
 * @returns {JSX.Element} The ReportModal component.
 */
const ReportModal = ({ title, content, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
            <p className="text-gray-600 mb-8">{content}</p>
            <button onClick={onClose} className="w-full bg-teal-600 text-white font-semibold py-3 rounded-lg hover:bg-teal-700 transition-colors">Close</button>
        </div>
    </div>
);

/**
 * The main page for the Reports & Analytics dashboard.
 * It displays key analytics metrics and provides buttons to generate various reports.
 * The report content is displayed in a modal.
 * @returns {JSX.Element} The ReportsAnalyticsPage component.
 */
export default function ReportsAnalyticsPage() {
    // State to control the visibility of the report modal.
    const [showReportModal, setShowReportModal] = useState(false);
    // State to store the content of the currently displayed report.
    const [modalContent, setModalContent] = useState({ title: '', content: '' });

    /**
     * Handles the click event for a report button.
     * It sets the content for the modal based on the selected report and shows the modal.
     * @param {string} reportName - The name of the report to display.
     */
    const handleReportClick = (reportName) => {
        setModalContent(reportMockData[reportName]);
        setShowReportModal(true);
    };

    /**
     * Handles closing the report modal.
     */
    const handleCloseModal = () => {
        setShowReportModal(false);
    };

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

            {/* Report Buttons Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ReportButton title="Platform Usage Report" icon={<ChartIcon />} onClick={() => handleReportClick("Platform Usage Report")} />
                <ReportButton title="User Activity Report" icon={<UsersIcon />} onClick={() => handleReportClick("User Activity Report")} />
                <ReportButton title="Security Audit Report" icon={<ShieldIcon />} onClick={() => handleReportClick("Security Audit Report")} />
                <ReportButton title="Compliance Report" icon={<FileIcon />} onClick={() => handleReportClick("Compliance Report")} />
            </div>

            {/* Conditionally render the report modal */}
            {showReportModal && (
                <ReportModal
                    title={modalContent.title}
                    content={modalContent.content}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
}