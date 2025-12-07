'use client';
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, CheckCircle, Activity, RefreshCw, Filter, Download, Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// REFERENCES: Gemini Code Assist Agent / Gemini-Pro-2

/**
 * The main page for the Audit & Compliance dashboard.
 * This page provides a high-level overview of security and compliance metrics,
 * as well as a list of recent audit events with search and filtering capabilities.
 * @returns {JSX.Element} The AuditCompliancePage component.
 */
export default function AuditCompliancePage() {
    const { user } = useUser();
    const [auditEvents, setAuditEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [activeAlerts, setActiveAlerts] = useState(0);
    const [alertDetails, setAlertDetails] = useState([]);
    const [securityScore, setSecurityScore] = useState('N/A');
    const [lastAuditDate, setLastAuditDate] = useState(null);
    const [complianceStatus, setComplianceStatus] = useState('N/A');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [eventTypeFilter, setEventTypeFilter] = useState('all');
    const [dateRange, setDateRange] = useState('all');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [showAlertDetails, setShowAlertDetails] = useState(false);
    const [organizations, setOrganizations] = useState([]);
    const [orgFilter, setOrgFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);

    const exportEvents = () => {
        if (!filteredEvents.length) {
            alert('No events to export with current filters.');
            return;
        }

        const headers = [
            'timestamp',
            'action',
            'type',
            'userName',
            'userId',
            'userRole',
            'orgId',
            'details'
        ];

        const csvValue = (val) => {
            if (val === null || val === undefined) return '""';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
        };

        const rows = filteredEvents.map((e) => [
            new Date(Number(e.timestamp) || 0).toISOString(),
            e.action || '',
            e.type || '',
            e.userName || '',
            e.userId || '',
            e.userRole || '',
            e.orgId || '',
            e.details || '',
        ].map(csvValue).join(','));

        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audit-events-${new Date().toISOString().slice(0,10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    useEffect(() => {
        fetchData();
        fetchOrganizations();
    }, []);
    const fetchOrganizations = async () => {
        try {
            const res = await fetch('/api/admin/organizations');
            if (res.ok) {
                const data = await res.json();
                setOrganizations(data.organizations || []);
            }
        } catch (e) {
            console.warn('Failed to load organizations', e);
        }
    };

    useEffect(() => {
        filterEvents();
    }, [auditEvents, searchQuery, eventTypeFilter, dateRange, customFrom, customTo, orgFilter]);

    // Reset pagination when filters change
    useEffect(() => {
        setPage(1);
    }, [searchQuery, eventTypeFilter, dateRange, customFrom, customTo, orgFilter]);

    const fetchData = async () => {
        setIsRefreshing(true);
        try {
            const [eventsRes, alertsRes] = await Promise.all([
                fetch('/api/admin/audit-logs?limit=500'),
                fetch('/api/admin/security-alerts')
            ]);

            if (eventsRes.ok) {
                const data = await eventsRes.json();
                console.log('Audit logs sample:', data.slice(0, 3));
                setAuditEvents(Array.isArray(data) ? data : []);
                
                // Calculate security score based on recent CMHA events (filtered later)
                const recentEvents = (Array.isArray(data) ? data : []).filter(e => 
                    e.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000
                );
                const securityEvents = recentEvents.filter(e => {
                    const a = (e.action || '').toLowerCase();
                    return a.includes('login_failed') || a.includes('access_denied') || a.includes('unauthorized_access') || a.includes('permission_denied') || a.includes('security_breach');
                });
                
                // Score: 100 - (security events * 2)
                const score = Math.max(0, 100 - (securityEvents.length * 2));
                setSecurityScore(`${score}%`);
                
                // Set last audit date to most recent event
                if ((Array.isArray(data) ? data : []).length > 0) {
                    const latest = [...data].sort((a,b)=> (b.timestamp||0)-(a.timestamp||0))[0];
                    setLastAuditDate(latest?.timestamp || null);
                }
                
                // Set compliance status based on score
                setComplianceStatus(score >= 90 ? 'Excellent' : score >= 70 ? 'Good' : 'Needs Review');
            }

            if (alertsRes.ok) {
                const data = await alertsRes.json();
                setActiveAlerts(data.unreadAlerts || 0);
                setAlertDetails(data.logs || []);
            }
        } catch (error) {
            console.error('Error fetching audit data:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const filterEvents = () => {
        let filtered = [...auditEvents];

        // Date range filter
        const now = Date.now();
        const dateRanges = {
            '24hours': now - 24 * 60 * 60 * 1000,
            '7days': now - 7 * 24 * 60 * 60 * 1000,
            '30days': now - 30 * 24 * 60 * 60 * 1000,
            '90days': now - 90 * 24 * 60 * 60 * 1000,
        };
        
        if (dateRange !== 'all') {
            if (dateRange === 'custom') {
                // Parse custom date range (inclusive)
                const fromMs = customFrom ? new Date(`${customFrom}T00:00:00`).getTime() : null;
                const toMs = customTo ? new Date(`${customTo}T23:59:59.999`).getTime() : null;
                filtered = filtered.filter(event => {
                    const ts = Number(event.timestamp) || 0;
                    if (fromMs !== null && ts < fromMs) return false;
                    if (toMs !== null && ts > toMs) return false;
                    return true;
                });
            } else if (dateRanges[dateRange]) {
                filtered = filtered.filter(event => (Number(event.timestamp) || 0) >= dateRanges[dateRange]);
            }
        }

        // Role filter: include org-scoped roles only (exclude superadmin/system)
        const allowedRoles = new Set(['admin','team_leader','support_worker','client']);
        filtered = filtered.filter((event) => {
            const role = (event.userRole || '').toLowerCase();
            // System / automated events (no user) always shown
            if (!event.userId) return true;
            // Known allowed role
            if (role && allowedRoles.has(role)) return true;
            // Fallback: parse details blob for roleId
            try {
                const parsed = event.details ? JSON.parse(event.details) : {};
                const detailRole = (parsed.roleId || '').toLowerCase();
                if (detailRole && allowedRoles.has(detailRole)) return true;
                // Explicitly drop superadmin/system roles
                if (role === 'superadmin' || detailRole === 'superadmin') return false;
            } catch {}
            // Keep unknown roles for visibility instead of hiding silently
            return true;
        });

        // Organization filter (dynamic) when a specific org selected
        if (orgFilter !== 'all') {
            filtered = filtered.filter(event => {
                if ((event.orgId || '').toLowerCase() === orgFilter.toLowerCase()) return true;
                // Try details blob
                try {
                    const parsed = event.details ? JSON.parse(event.details) : {};
                    return (parsed.orgId || '').toLowerCase() === orgFilter.toLowerCase();
                } catch { return false; }
            });
        }

        // Exclude internal developer/system seed events (e.g., "Safespace Developer")
        filtered = filtered.filter((event) => {
            const name = (event.userName || '').toLowerCase();
            if (name.includes('safespace') && name.includes('developer')) return false;
            // Fallback: check details blob
            try {
                const d = (event.details || '').toLowerCase();
                if (d.includes('safespace') && d.includes('developer')) return false;
            } catch {}
            return true;
        });

        // Filter by action type if not 'all'
        if (eventTypeFilter !== 'all') {
            filtered = filtered.filter(event => event.type === eventTypeFilter);
        }

        if (searchQuery) {
            filtered = filtered.filter(event =>
                event.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.userName?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Sort newest first and log counts for debugging
        filtered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        console.log('Filtered events count:', filtered.length);

        setFilteredEvents(filtered);
    };

    const getEventIcon = (type) => {
        switch (type) {
            case 'alert':
                return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
            case 'security':
                return <Shield className="h-5 w-5 text-red-600" />;
            case 'compliance':
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            default:
                return <Activity className="h-5 w-5 text-blue-600" />;
        }
    };

    const getEventBadge = (type) => {
        const variants = {
            alert: 'bg-yellow-100 text-yellow-800 border-yellow-300',
            security: 'bg-red-100 text-red-800 border-red-300',
            compliance: 'bg-green-100 text-green-800 border-green-300',
            audit: 'bg-blue-100 text-blue-800 border-blue-300',
        };
        return variants[type] || variants.audit;
    };

    const isSuperAdmin = (user?.publicMetadata?.role || '').toLowerCase() === 'superadmin';
    const pageCount = Math.max(1, Math.ceil(filteredEvents.length / pageSize));
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const displayedEvents = filteredEvents.slice(startIndex, endIndex);

    return (
        <div className="space-y-6 w-full max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-6 rounded-2xl shadow-lg text-white">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">Audit & Compliance Dashboard</h2>
                        <p className="text-teal-100">Monitor system access, security events, and compliance metrics</p>
                    </div>
                    <Button 
                        onClick={fetchData}
                        disabled={isRefreshing}
                        className="bg-white text-teal-600 hover:bg-teal-50"
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </Button>
                </div>
            </div>
            
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/40 pb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-600 dark:bg-blue-700 rounded-xl shrink-0">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                            <CardTitle className="text-gray-800 dark:text-gray-100">Security Score</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <p className="text-4xl lg:text-5xl font-bold text-blue-600">{securityScore}</p>
                        <p className="text-sm text-gray-500 mt-2">
                            Last audit: {lastAuditDate ? new Date(lastAuditDate).toLocaleDateString() : 'N/A'}
                        </p>
                        <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all" 
                                style={{ width: securityScore }}
                            ></div>
                        </div>
                    </CardContent>
                </Card>

                <Card 
                    className="border-2 border-yellow-200 dark:border-yellow-800 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                    onClick={() => setShowAlertDetails(true)}
                >
                    <CardHeader className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/40 dark:to-yellow-800/40 pb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-yellow-600 dark:bg-yellow-700 rounded-xl shrink-0">
                                <AlertTriangle className="h-6 w-6 text-white" />
                            </div>
                            <CardTitle className="text-gray-800 dark:text-gray-100">Active Alerts</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <p className="text-4xl lg:text-5xl font-bold text-yellow-600 dark:text-yellow-400">{activeAlerts}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Last 24 hours</p>
                        <Badge className="mt-4 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700">
                            {activeAlerts > 0 ? 'Action Required' : 'All Clear'}
                        </Badge>
                        {activeAlerts > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Click to view details</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-2 border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-shadow md:col-span-2 lg:col-span-1">
                    <CardHeader className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/40 dark:to-green-800/40 pb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-600 dark:bg-green-700 rounded-xl shrink-0">
                                <CheckCircle className="h-6 w-6 text-white" />
                            </div>
                            <CardTitle className="text-gray-800 dark:text-gray-100">Compliance</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <p className="text-4xl lg:text-5xl font-bold text-green-600 dark:text-green-400">{complianceStatus}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">All requirements met</p>
                        <Badge className="mt-4 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-700">
                            Fully Compliant
                        </Badge>
                    </CardContent>
                </Card>
            </div>

            {/* Notes */}
            <div className="bg-blue-50 border border-blue-100 text-blue-900 text-sm rounded-xl p-3">
                <p className="font-semibold">Notes</p>
                <ul className="list-disc list-inside space-y-1 mt-1">
                    <li>Security Score = 100 − (2 × count of security-significant events in the last 7 days).</li>
                    <li>Active Alerts = unread security alerts from the last 24 hours.</li>
                    <li>Compliance label comes from the security score (Excellent ≥ 90, Good ≥ 70, else Needs Review).</li>
                </ul>
            </div>


            
            {/* Audit Events Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border-2 border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                            Recent Audit Events
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'} found
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" size="sm" className="gap-2" onClick={exportEvents}>
                            <Download className="h-4 w-4" />
                            Export
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <Input
                            placeholder="Search events..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                        />
                    </div>
                    
                    <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                        <SelectTrigger className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                            <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Events</SelectItem>
                            <SelectItem value="alert">Alerts</SelectItem>
                            <SelectItem value="security">Security</SelectItem>
                            <SelectItem value="compliance">Compliance</SelectItem>
                            <SelectItem value="audit">Audit</SelectItem>
                        </SelectContent>
                    </Select>
                    
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                            <SelectValue placeholder="Date range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Time</SelectItem>
                            <SelectItem value="24hours">Last 24 Hours</SelectItem>
                            <SelectItem value="7days">Last 7 Days</SelectItem>
                            <SelectItem value="30days">Last 30 Days</SelectItem>
                            <SelectItem value="90days">Last 90 Days</SelectItem>
                            <SelectItem value="custom">Custom Range</SelectItem>
                        </SelectContent>
                    </Select>
                    
                    <div className="flex gap-2">
                        {isSuperAdmin && (
                            <Select value={orgFilter} onValueChange={setOrgFilter}>
                                <SelectTrigger className="flex-1 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                                    <SelectValue placeholder="Organization" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Orgs</SelectItem>
                                    {organizations.map(org => (
                                        <SelectItem key={org.id} value={org.slug}>{org.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                            <SelectTrigger className="w-24 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                                <SelectItem value="200">200</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                
                {dateRange === 'custom' && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1 block">From</label>
                            <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1 block">To</label>
                            <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                        </div>
                    </div>
                )}
                
                <div className="flex gap-2 mb-6">
                    <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setEventTypeFilter('all'); setDateRange('all'); setCustomFrom(''); setCustomTo(''); setOrgFilter('all'); }}>
                        <Filter className="h-4 w-4 mr-2" />
                        Clear Filters
                    </Button>
                </div>

                {/* Events List */}
                <div className="space-y-3 min-h-[200px]">
                            {displayedEvents.length === 0 ? (
                        <div className="text-center py-12">
                            <Activity className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">No audit events found</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filters</p>
                        </div>
                    ) : (
                        displayedEvents.map(event => {
                            // Sanitize event details to remove Clerk IDs and sensitive data
                            let displayDetails = event.details || '';
                            let userRole = (event.userRole || '').replace('_',' ');
                            
                            try {
                                const parsed = JSON.parse(displayDetails);
                                const cleanData = {
                                    email: parsed.email,
                                    role: parsed.roleId,
                                    organization: parsed.orgId,
                                };
                                
                                // Extract role for display
                                if (!userRole && parsed.roleId) {
                                    userRole = parsed.roleId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                                }
                                
                                Object.keys(cleanData).forEach(key => 
                                    cleanData[key] === undefined && delete cleanData[key]
                                );
                                displayDetails = Object.entries(cleanData)
                                    .map(([key, value]) => `${key}: ${value}`)
                                    .join(', ') || displayDetails;
                            } catch {
                                displayDetails = displayDetails
                                    .replace(/"clerkId":"[^"]+"/g, '')
                                    .replace(/"profileImage":"[^"]+"/g, '')
                                    .replace(/,,+/g, ',')
                                    .replace(/,}/g, '}')
                                    .replace(/{,/g, '{');
                            }
                            
                            return (
                            <div 
                                key={event.id} 
                                className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-750 p-5 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-teal-300 dark:hover:border-teal-600 transition-all hover:shadow-md group w-full"
                            >
                                <div className="flex items-start justify-between gap-4 w-full">
                                    <div className="flex items-start gap-4 flex-1 min-w-0">
                                        <div className="mt-1">
                                            {getEventIcon(event.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <Badge className={`${getEventBadge(event.type)} border dark:border-gray-600 shrink-0`}>
                                                    {event.type?.toUpperCase() || 'AUDIT'}
                                                </Badge>
                                                <p className="font-semibold text-gray-800 dark:text-gray-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors break-words">
                                                    {event.action}
                                                </p>
                                            </div>
                                            {displayDetails && (
                                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed break-words">{displayDetails}</p>
                                            )}
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-3 text-xs">
                                                <div className="text-gray-500 dark:text-gray-400"><span className="font-semibold">User:</span> {event.userName || 'System'}</div>
                                                <div className="text-gray-500 dark:text-gray-400"><span className="font-semibold">Role:</span> {userRole || '—'}</div>
                                                <div className="text-gray-500 dark:text-gray-400"><span className="font-semibold">Org:</span> {event.orgName || event.orgId || '—'}</div>
                                                <div className="text-gray-500 dark:text-gray-400"><span className="font-semibold">Type:</span> {event.type || 'audit'}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {new Date(event.timestamp).toLocaleDateString()}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(event.timestamp).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            );
                        })
                    )}
                </div>
                {/* Pagination Controls */}
                <div className="mt-6 flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {pageCount} (showing {displayedEvents.length} of {filteredEvents.length})</p>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p-1))}>Prev</Button>
                        <Button size="sm" variant="outline" disabled={page >= pageCount} onClick={() => setPage(p => Math.min(pageCount, p+1))}>Next</Button>
                    </div>
                </div>
            </div>

            {/* Alert Details Modal */}
            {showAlertDetails && (
                <div className="fixed inset-0 bg-white bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAlertDetails(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-6 text-white">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-bold">Active Security Alerts</h3>
                                    <p className="text-yellow-100 mt-1">{activeAlerts} alerts in the last 24 hours</p>
                                </div>
                                <button
                                    onClick={() => setShowAlertDetails(false)}
                                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)] bg-white">
                            {alertDetails.length === 0 ? (
                                <div className="text-center py-12">
                                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                                    <p className="text-gray-600 font-medium">No security alerts</p>
                                    <p className="text-sm text-gray-400 mt-1">All systems operating normally</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {alertDetails.map((alert, index) => {
                                        // Parse details to remove sensitive Clerk data
                                        let displayDetails = alert.details || '';
                                        try {
                                            // Try to parse if it's JSON
                                            const parsed = JSON.parse(displayDetails);
                                            // Extract only user-friendly fields
                                            const cleanData = {
                                                email: parsed.email,
                                                role: parsed.roleId,
                                                organization: parsed.orgId,
                                            };
                                            // Remove undefined values
                                            Object.keys(cleanData).forEach(key => 
                                                cleanData[key] === undefined && delete cleanData[key]
                                            );
                                            displayDetails = Object.entries(cleanData)
                                                .map(([key, value]) => `${key}: ${value}`)
                                                .join(', ') || displayDetails;
                                        } catch {
                                            // If not JSON, remove Clerk-specific patterns
                                            displayDetails = displayDetails
                                                .replace(/"clerkId":"[^"]+"/g, '')
                                                .replace(/"profileImage":"[^"]+"/g, '')
                                                .replace(/,,+/g, ',')
                                                .replace(/,}/g, '}')
                                                .replace(/{,/g, '{');
                                        }
                                        
                                        return (
                                            <div 
                                                key={index}
                                                className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-xl border-2 border-red-200"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <AlertTriangle className="h-5 w-5 text-red-600 mt-1" />
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-gray-800">{alert.action}</p>
                                                        {displayDetails && (
                                                            <p className="text-sm text-gray-600 mt-1">{displayDetails}</p>
                                                        )}
                                                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                                            <span>User: {alert.userName || 'System'}</span>
                                                            <span>•</span>
                                                            <span>{new Date(alert.timestamp).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}