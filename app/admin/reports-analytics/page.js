'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LineChart, Users, Shield, FileText, Download, RefreshCw } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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
    const [reportType, setReportType] = useState('userManagement'); // userManagement|audits|performance
    const [dateRange, setDateRange] = useState('30days'); // all|24hours|7days|30days|90days|custom
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);

    const params = useMemo(() => {
        const p = new URLSearchParams();
        p.set('type', reportType);
        if (dateRange === 'custom') {
            if (customFrom) p.set('startDate', String(new Date(`${customFrom}T00:00:00`).getTime()));
            if (customTo) p.set('endDate', String(new Date(`${customTo}T23:59:59.999`).getTime()));
        } else if (dateRange !== 'all') {
            p.set('range', dateRange);
        }
        return p.toString();
    }, [reportType, dateRange, customFrom, customTo]);

    async function fetchReport() {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/reports/generate?${params}`);
            const json = await res.json();
            setData(json);
        } catch (e) {
            console.error('Failed to load report', e);
            setData(null);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params]);

    async function exportExcel() {
        if (!data) return;
        const { utils, writeFile } = await import('xlsx');
        let sheetData = [];
        
        if (reportType === 'userManagement') {
            const users = data.data?.users || [];
            sheetData = users.map(u => ({
                'Name': `${u.firstName || ''} ${u.lastName || ''}`.trim(),
                'Email': u.email || '',
                'Role': u.roleId || '',
                'Status': u.status || '',
                'Phone': u.phoneNumber || '',
                'Organization': u.orgId || '',
                'Created': u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '',
                'Last Login': u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : ''
            }));
        } else if (reportType === 'audits') {
            const logs = data.data?.logs || [];
            sheetData = logs.map(l => ({
                'Date': new Date(l.timestamp).toLocaleString(),
                'Action': l.action || '',
                'User': l.userName || 'System',
                'Email': l.userEmail || '',
                'Role': l.userRole || '',
                'Entity Type': l.entityType || '',
                'Organization': l.orgName || '',
                'Details': l.details || ''
            }));
        } else if (reportType === 'performance') {
            const users = data.data?.users || [];
            sheetData = users.map(u => ({
                'User': u.userName || 'Unknown',
                'Email': u.userEmail || '',
                'Role': u.userRole || '',
                'Total Actions': u.totalActions || 0,
                'Top Action': Object.entries(u.byAction || {}).sort((a,b)=>b[1]-a[1])[0]?.[0] || '',
                'Action Count': Object.entries(u.byAction || {}).sort((a,b)=>b[1]-a[1])[0]?.[1] || 0
            }));
        }
        
        const ws = utils.json_to_sheet(sheetData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, reportType);
        writeFile(wb, `${reportType}-report.xlsx`);
    }

    async function exportPdf() {
        if (!data) return;
        const jsPDF = (await import('jspdf')).default;
        const autoTable = (await import('jspdf-autotable')).default;
        const doc = new jsPDF();
        
        let headers = [];
        let rows = [];
        
        if (reportType === 'userManagement') {
            const users = data.data?.users || [];
            headers = ['Name', 'Email', 'Role', 'Status', 'Phone', 'Org'];
            rows = users.map(u => [
                `${u.firstName || ''} ${u.lastName || ''}`.trim(),
                u.email || '',
                u.roleId || '',
                u.status || '',
                u.phoneNumber || '',
                u.orgId || ''
            ]);
        } else if (reportType === 'audits') {
            const logs = data.data?.logs || [];
            headers = ['Date', 'Action', 'User', 'Role', 'Entity Type', 'Organization'];
            rows = logs.map(l => [
                new Date(l.timestamp).toLocaleString(),
                l.action || '',
                l.userName || 'System',
                l.userRole || '',
                l.entityType || '',
                l.orgName || ''
            ]);
        } else if (reportType === 'performance') {
            const users = data.data?.users || [];
            headers = ['User', 'Email', 'Role', 'Total Actions'];
            rows = users.map(u => [
                u.userName || 'Unknown',
                u.userEmail || '',
                u.userRole || '',
                u.totalActions || 0
            ]);
        }
        
        doc.setFontSize(16);
        doc.text(`${reportType.replace(/([A-Z])/g, ' $1').trim()} Report`, 14, 16);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 24);
        
        if (headers.length && rows.length) {
            autoTable(doc, { 
                head: [headers], 
                body: rows, 
                startY: 30,
                theme: 'grid',
                headStyles: { fillColor: [20, 184, 166], textColor: 255 },
                styles: { fontSize: 8, cellPadding: 2 }
            });
        } else {
            doc.setFontSize(10);
            doc.text('No data available for this report.', 14, 35);
        }
        
        doc.save(`${reportType}-report.pdf`);
    }

    async function exportWord() {
        if (!data) return;
        const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType } = await import('docx');
        
        let headers = [];
        let rows = [];
        
        if (reportType === 'userManagement') {
            const users = data.data?.users || [];
            headers = ['Name', 'Email', 'Role', 'Status', 'Phone'];
            rows = users.map(u => [
                `${u.firstName || ''} ${u.lastName || ''}`.trim(),
                u.email || '',
                u.roleId || '',
                u.status || '',
                u.phoneNumber || ''
            ]);
        } else if (reportType === 'audits') {
            const logs = data.data?.logs || [];
            headers = ['Date', 'Action', 'User', 'Role', 'Organization'];
            rows = logs.map(l => [
                new Date(l.timestamp).toLocaleString(),
                l.action || '',
                l.userName || 'System',
                l.userRole || '',
                l.orgName || ''
            ]);
        } else if (reportType === 'performance') {
            const users = data.data?.users || [];
            headers = ['User', 'Email', 'Role', 'Total Actions'];
            rows = users.map(u => [
                u.userName || 'Unknown',
                u.userEmail || '',
                u.userRole || '',
                String(u.totalActions || 0)
            ]);
        }

        const tableRows = [
            new TableRow({
                children: headers.map(h => new TableCell({ 
                    children: [new Paragraph({ 
                        children: [new TextRun({ text: h, bold: true, color: '14B8A6' })],
                        alignment: AlignmentType.CENTER
                    })],
                    shading: { fill: 'F0FDFA' }
                }))
            }),
            ...rows.map(r => new TableRow({
                children: r.map(cell => new TableCell({ 
                    children: [new Paragraph({ text: String(cell || ''), style: 'Normal' })] 
                }))
            }))
        ];

        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({ 
                        children: [new TextRun({ 
                            text: `${reportType.replace(/([A-Z])/g, ' $1').trim()} Report`, 
                            bold: true, 
                            size: 32,
                            color: '14B8A6'
                        })],
                        spacing: { after: 200 }
                    }),
                    new Paragraph({
                        children: [new TextRun({ 
                            text: `Generated: ${new Date().toLocaleString()}`, 
                            size: 20,
                            color: '6B7280'
                        })],
                        spacing: { after: 400 }
                    }),
                    new Table({ 
                        rows: tableRows,
                        width: { size: 100, type: WidthType.PERCENTAGE }
                    })
                ]
            }]
        });
        
        const blob = await Packer.toBlob(doc);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${reportType}-report.docx`;
        a.click();
    }

    // Lightweight inline charts without adding heavy SSR libs
    function SimpleBar({ items, labelKey, valueKey }) {
        const max = Math.max(1, ...items.map(i => i[valueKey] || 0));
        return (
            <div className="space-y-2">
                {items.map((i, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                        <div className="w-48 truncate text-sm text-gray-600">{String(i[labelKey])}</div>
                        <div className="flex-1 h-3 bg-gray-100 rounded">
                            <div className="h-3 bg-teal-500 rounded" style={{ width: `${((i[valueKey] || 0) / max) * 100}%` }} />
                        </div>
                        <div className="w-12 text-right text-sm text-gray-700">{i[valueKey] || 0}</div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="bg-white p-8 rounded-2xl shadow-lg space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-gray-800">Reports & Analytics</h2>
                    <p className="text-sm text-gray-500">Generate dynamic, exportable reports with charts</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={exportExcel} disabled={!data}><Download className="h-4 w-4 mr-2"/>Excel</Button>
                    <Button variant="outline" onClick={exportPdf} disabled={!data}><Download className="h-4 w-4 mr-2"/>PDF</Button>
                    <Button variant="outline" onClick={exportWord} disabled={!data}><Download className="h-4 w-4 mr-2"/>Word</Button>
                    <Button onClick={fetchReport} disabled={loading} className="bg-teal-600 text-white">{loading ? <RefreshCw className="h-4 w-4 animate-spin"/> : 'Refresh'}</Button>
                </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger><SelectValue placeholder="Report Type"/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="userManagement">User Management</SelectItem>
                        <SelectItem value="audits">Audits</SelectItem>
                        <SelectItem value="performance">Performance (TL/SW)</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger><SelectValue placeholder="Date Range"/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="24hours">Last 24 Hours</SelectItem>
                        <SelectItem value="7days">Last 7 Days</SelectItem>
                        <SelectItem value="30days">Last 30 Days</SelectItem>
                        <SelectItem value="90days">Last 90 Days</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                </Select>
                {dateRange === 'custom' && (
                    <div className="flex gap-2">
                        <Input type="date" value={customFrom} onChange={(e)=>setCustomFrom(e.target.value)} />
                        <Input type="date" value={customTo} onChange={(e)=>setCustomTo(e.target.value)} />
                    </div>
                )}
                <div className="flex gap-2">
                    <Button variant="outline" onClick={()=>{ setDateRange('30days'); setCustomFrom(''); setCustomTo(''); }}>Reset</Button>
                </div>
            </div>

            {/* Content */}
            {!data ? (
                <div className="text-sm text-gray-500">Loading data...</div>
            ) : (
                <div className="space-y-6">
                    {reportType === 'userManagement' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <AnalyticsCard title="Total Users" value={data.data?.stats?.total || 0} subtitle="In organization" valueColor="text-blue-600"/>
                            <AnalyticsCard title="Active" value={data.data?.stats?.active || 0} subtitle="Currently active" valueColor="text-green-600"/>
                            <AnalyticsCard title="Suspended" value={data.data?.stats?.suspended || 0} subtitle="Access disabled" valueColor="text-red-600"/>
                            <Card className="lg:col-span-2">
                                <CardHeader><CardTitle>By Role</CardTitle></CardHeader>
                                <CardContent>
                                    <SimpleBar items={Object.entries(data.data?.stats?.byRole || {}).map(([k,v])=>({ role:k, count:v }))} labelKey="role" valueKey="count"/>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle>Users (sample)</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="text-xs text-gray-600">{(data.data?.users || []).slice(0,8).map(u => (
                                        <div key={u._id} className="py-1 flex justify-between border-b border-gray-100">
                                            <span className="truncate mr-2">{u.firstName} {u.lastName}</span>
                                            <span className="text-gray-500">{u.roleId}</span>
                                        </div>
                                    ))}</div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {reportType === 'audits' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <AnalyticsCard title="Total Events" value={data.data?.total || 0} subtitle="In range" valueColor="text-teal-600"/>
                            <Card className="lg:col-span-2">
                                <CardHeader><CardTitle>Events by Day</CardTitle></CardHeader>
                                <CardContent>
                                    <SimpleBar items={(data.data?.series || []).map(s=>({ label:new Date(s.date).toLocaleDateString(), count:s.count }))} labelKey="label" valueKey="count"/>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle>Top Actions</CardTitle></CardHeader>
                                <CardContent>
                                    <SimpleBar items={Object.entries(data.data?.byAction || {}).map(([k,v])=>({ action:k, count:v })).sort((a,b)=>b.count-a.count).slice(0,10)} labelKey="action" valueKey="count"/>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {reportType === 'performance' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <AnalyticsCard title="Clients in Org" value={data.data?.clientCount || 0} subtitle="Total clients" valueColor="text-blue-600"/>
                            <Card className="lg:col-span-2">
                                <CardHeader><CardTitle>Actions per User</CardTitle></CardHeader>
                                <CardContent>
                                    <SimpleBar items={(data.data?.users || []).sort((a,b)=> (b.totalActions||0)-(a.totalActions||0)).slice(0,12).map(u=>({ label: u.userName || u.userEmail || 'Unknown', count: u.totalActions }))} labelKey="label" valueKey="count"/>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle>Top Users (by actions)</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="text-xs text-gray-700 space-y-1">
                                        {(data.data?.users || []).sort((a,b)=> (b.totalActions||0)-(a.totalActions||0)).slice(0,8).map(u => (
                                            <div key={(u.userId||u.userEmail||u.userName)} className="flex justify-between border-b border-gray-100 py-1">
                                                <span className="truncate mr-2">{u.userName || u.userEmail || 'Unknown'}</span>
                                                <span className="text-gray-500">{u.totalActions}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}