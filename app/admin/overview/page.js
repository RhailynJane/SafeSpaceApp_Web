// File path: app/admin/overview/page.js

// REFERENCES: Gemini Code Assist Agent / Gemini-Pro-2 

// REFERENCES: Gemini Code Assist Agent / Gemini-Pro-2 

// REFERENCES: Gemini Code Assist Agent / Gemini-Pro-2 

'use client';
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { X, Server, Database, CheckCircle2, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Info } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

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
const StatCard = ({ title, value, tooltip, series = [], compact = false }) => (
    <div className={"rounded-xl border border-border/60 bg-muted/40 backdrop-blur-sm text-center " + (compact ? "p-3" : "p-5") }>
        <div className="flex items-center justify-center gap-2">
            <span className={"font-medium text-muted-foreground tracking-wide uppercase " + (compact ? "text-[10px]" : "text-xs")}>{title}</span>
            {tooltip ? <InfoTip>{tooltip}</InfoTip> : null}
        </div>
        <p className={(compact ? "mt-1 text-3xl" : "mt-2 text-4xl") + " font-semibold tabular-nums text-foreground"}>{value}</p>
        {series && series.length > 0 ? (
            <div className="mt-2 flex justify-center">
                <Sparkline series={series} className="text-emerald-500/60" height={24} width={72} />
            </div>
        ) : null}
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
const ToneIcon = ({ tone = 'success' }) => (
    tone === 'success' ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-600/90" aria-hidden />
    ) : (
        <AlertTriangle className="h-4 w-4 text-amber-600/90" aria-hidden />
    )
);

const HealthCard = ({ title, status, value, statusColor = 'text-emerald-600/90', icon, tooltip, compact = false }) => (
    <div className={"flex-1 rounded-xl border border-border/60 bg-card " + (compact ? "p-4" : "p-5") }>
        <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className={"font-medium text-muted-foreground uppercase tracking-wide " + (compact ? "text-[10px]" : "text-xs")}>{title}</span>
                {tooltip ? <InfoTip>{tooltip}</InfoTip> : null}
            </div>
            {icon}
        </div>
        <div className="flex items-baseline gap-2">
            <ToneIcon tone={statusColor.includes('emerald') ? 'success' : 'warning'} />
            <p className={`font-semibold ${compact ? 'text-lg' : 'text-xl'} ${statusColor}`}>{status}</p>
        </div>
        <p className="text-xs text-muted-foreground">{value}</p>
    </div>
);
// Lightweight tooltip using Radix Popover (opens on hover/focus)
const InfoTip = ({ children }) => {
    const [open, setOpen] = useState(false);
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
                onMouseEnter={() => setOpen(true)}
                onMouseLeave={() => setOpen(false)}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus:outline-none"
                aria-label="More info"
            >
                <Info className="h-3.5 w-3.5" />
            </PopoverTrigger>
            <PopoverContent side="top" className="text-sm leading-snug max-w-xs">
                {children}
            </PopoverContent>
        </Popover>
    );
};

// Tiny sparkline SVG (24px height)
const Sparkline = ({ series = [], className = "text-foreground/50", width = 56, height = 24 }) => {
    const w = width, h = height;
    if (!series.length) return null;
    const min = Math.min(...series);
    const max = Math.max(...series);
    const span = max - min || 1;
    const pts = series.map((v, i) => {
        const x = (i / (series.length - 1)) * (w - 2) + 1; // 1px padding
        const y = h - 1 - ((v - min) / span) * (h - 2);
        return `${x},${y}`;
    }).join(' ');
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={className} aria-hidden>
            <polyline fill="none" stroke="currentColor" strokeWidth="1.5" points={pts} />
        </svg>
    );
};

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
    <div className="bg-card p-4 rounded-xl shadow-sm flex justify-between items-center border border-border">
        <div>
            <p className="font-semibold text-foreground">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
            <p className="text-xs text-muted-foreground mt-1">{time}</p>
        </div>
        <span className="bg-accent text-accent-foreground text-xs font-semibold px-3 py-1 rounded-full">info</span>
    </div>
);

const DetailedMetricsModal = ({ onClose }) => {
    const [metrics, setMetrics] = useState({ totalUsers: 0 });
    const [databaseStatus, setDatabaseStatus] = useState('checking');
    const [clerkStatus, setClerkStatus] = useState('checking');
    const [apiResponseTime, setApiResponseTime] = useState(0);
    const [apiServerTime, setApiServerTime] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // Sparklines series for modal metrics
    const [seriesUsers, setSeriesUsers] = useState([]);
    const [seriesDb, setSeriesDb] = useState([]); // 0/100
    const [seriesAuth, setSeriesAuth] = useState([]); // 0/100
    const [seriesApi, setSeriesApi] = useState([]); // ms
    const [hasServerSeries, setHasServerSeries] = useState(false);

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

        const parseServerTiming = (header) => {
            if (!header) return null;
            // e.g., "app;desc=\"API handler\";dur=1.2, other;dur=0.1"
            const m = header.match(/dur=([0-9]*\.?[0-9]+)/);
            return m ? Number(m[1]) : null;
        };

        const fetchApiResponseTime = async () => {
            try {
                const samples = [];
                const serverSamples = [];
                for (let i = 0; i < 5; i++) {
                    const t0 = performance.now();
                    const resp = await fetch('/api/admin/ping', { cache: 'no-store' });
                    const t1 = performance.now();
                    const json = await resp.json().catch(() => ({}));
                    const rtt = t1 - t0;
                    const serverMs = typeof json.serverMs === 'number' ? json.serverMs : parseServerTiming(resp.headers.get('server-timing'));
                    samples.push(rtt);
                    if (typeof serverMs === 'number') serverSamples.push(serverMs);
                    // Short pause between samples to reduce contention
                    await new Promise((r) => setTimeout(r, 80));
                }
                const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
                const avgServer = serverSamples.length ? serverSamples.reduce((a, b) => a + b, 0) / serverSamples.length : null;
                setApiResponseTime(Math.round(avg));
                setApiServerTime(avgServer !== null ? Math.round(avgServer) : null);
                setSeriesApi((arr) => [...arr.slice(-9), Math.round(avg)]);
            } catch (error) {
                setApiResponseTime(-1);
                setApiServerTime(null);
            }
        };

        fetchMetrics();
        fetchDatabaseHealth();
        fetchClerkHealth();
        fetchApiResponseTime();

        // Try server-provided series (optional)
        (async () => {
            try {
                const resp = await fetch('/api/admin/metrics-series?window=10m', { cache: 'no-store' });
                if (resp.ok) {
                    const json = await resp.json();
                    if (Array.isArray(json.users)) setSeriesUsers(json.users.slice(-10));
                    // map statuses to 0 or 100 if provided
                    if (Array.isArray(json.dbOk)) setSeriesDb(json.dbOk.slice(-10).map(v => v ? 100 : 0));
                    if (Array.isArray(json.authOk)) setSeriesAuth(json.authOk.slice(-10).map(v => v ? 100 : 0));
                    if (Array.isArray(json.apiMs)) setSeriesApi(json.apiMs.slice(-10));
                    setHasServerSeries(true);
                }
            } catch {}
        })();

        const interval = setInterval(() => {
            if (!hasServerSeries) {
                setSeriesUsers((arr) => [...arr.slice(-9), metrics.totalUsers || 0]);
                setSeriesDb((arr) => [...arr.slice(-9), databaseStatus === 'ok' ? 100 : 0]);
                setSeriesAuth((arr) => [...arr.slice(-9), clerkStatus === 'connected' ? 100 : 0]);
            }
        }, 60_000);

        return () => clearInterval(interval);
    }, []);

    const MetricBar = ({ label, value, subText, threshold, percentage, status = "normal", tooltip, series }) => (
        <div className="bg-card p-4 rounded-xl shadow-sm border border-border">
            {/* Header with label, tooltip and status */}
            <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{label}</p>
                    {tooltip ? <InfoTip>{tooltip}</InfoTip> : null}
                </div>
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${status === 'normal' ? 'bg-accent text-accent-foreground' : 'bg-destructive text-destructive-foreground'}`}>{status}</span>
            </div>
            {/* Current value */}
            <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
            {subText ? <p className="text-xs text-muted-foreground mb-2">{subText}</p> : null}
            {series && series.length ? (
                <div className="mb-2">
                    <Sparkline series={series} className="text-emerald-500/60" height={24} width={120} />
                </div>
            ) : null}
            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
            </div>
            {/* Threshold information */}
            <p className="text-right text-xs text-muted-foreground mt-1">Threshold: {threshold}</p>
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
                            <MetricBar
                                label="Database Status"
                                value={databaseStatus}
                                threshold=""
                                percentage={databaseStatus === 'ok' ? 100 : 0}
                                status={databaseStatus === 'ok' ? 'normal' : 'error'}
                                tooltip={
                                    "Database connectivity and basic health as reported by the backend. 'ok' means the DB responded within acceptable latency."
                                }
                                series={seriesDb}
                            />
                            <MetricBar
                                label="Authentication Status"
                                value={clerkStatus}
                                threshold=""
                                percentage={clerkStatus === 'connected' ? 100 : 0}
                                status={clerkStatus === 'connected' ? 'normal' : 'error'}
                                tooltip={
                                    "Indicates whether the authentication provider is reachable and responding."
                                }
                                series={seriesAuth}
                            />
                            <MetricBar
                                label="Users"
                                value={`${metrics.totalUsers} users`}
                                threshold="5000 users"
                                percentage={(metrics.totalUsers / 5000) * 100}
                                tooltip={
                                    "Total active users in your organization. Sourced from the Convex users table."
                                }
                                series={seriesUsers}
                            />
                            <MetricBar
                                label="API Response Time"
                                value={`${apiResponseTime >= 0 ? apiResponseTime : 'N/A'} ms`}
                                subText={apiServerTime !== null ? `server ~ ${apiServerTime} ms` : undefined}
                                threshold="1000 ms"
                                percentage={Math.min(100, Math.max(0, (apiResponseTime / 1000) * 100))}
                                status={apiResponseTime > 1000 ? 'error' : 'normal'}
                                tooltip={
                                    "Average of 5 round-trip samples to /api/admin/ping from your browser. 'server' shows handler time from the Server-Timing header."
                                }
                                series={seriesApi}
                            />
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


/**
 * The main overview page for the admin dashboard.
 * This component brings together all the smaller components to create the dashboard layout.
 * It displays high-level statistics, system health, and recent admin activities.
 * @returns {JSX.Element} The OverviewPage component.
 */
export default function OverviewPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const [compact, setCompact] = useState(false);
    // Restore persisted density preference
    useEffect(() => {
        try {
            const saved = typeof window !== 'undefined' ? window.localStorage.getItem('admin:compact') : null;
            if (saved === '1') setCompact(true);
        } catch {}
    }, []);
    // State to control the visibility of the detailed metrics modal.
    const [showMetricsModal, setShowMetricsModal] = useState(false);
    const [totalUsers, setTotalUsers] = useState(0);
    const [recentActivities, setRecentActivities] = useState([]);
    const [systemUptime, setSystemUptime] = useState('0.0%');
    const [securityAlerts, setSecurityAlerts] = useState(0);
    const [activeSessions, setActiveSessions] = useState(0);
    const [seriesUsers, setSeriesUsers] = useState([]);
    const [seriesUptime, setSeriesUptime] = useState([]);
    const [seriesAlerts, setSeriesAlerts] = useState([]);
    const [seriesSessions, setSeriesSessions] = useState([]);
    const [hasServerSeries, setHasServerSeries] = useState(false);

    useEffect(() => {
        const fetchTotalUsers = async () => {
            try {
                const response = await fetch('/api/admin/metrics');
                if (response.status === 403) {
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

        // Try to load server-provided time-series if available
        (async () => {
            try {
                const resp = await fetch('/api/admin/metrics-series?window=10m', { cache: 'no-store' });
                if (resp.ok) {
                    const json = await resp.json();
                    const u = Array.isArray(json.users) ? json.users : null;
                    const up = Array.isArray(json.uptime) ? json.uptime : null;
                    const al = Array.isArray(json.alerts) ? json.alerts : null;
                    const se = Array.isArray(json.sessions) ? json.sessions : null;
                    if (u && up && al && se) {
                        setSeriesUsers(u.slice(-10));
                        setSeriesUptime(up.slice(-10));
                        setSeriesAlerts(al.slice(-10));
                        setSeriesSessions(se.slice(-10));
                        setHasServerSeries(true);
                    }
                }
            } catch {}
        })();
        const seedSeries = () => {
            const parsePct = (s) => {
                const n = Number(String(s).replace('%',''));
                return Number.isFinite(n) ? n : 0;
            };
            setSeriesUsers((prev) => (prev.length ? prev : Array(10).fill(0).map(() => totalUsers)));
            setSeriesUptime((prev) => (prev.length ? prev : Array(10).fill(parsePct(systemUptime))));
            setSeriesAlerts((prev) => (prev.length ? prev : Array(10).fill(securityAlerts)));
            setSeriesSessions((prev) => (prev.length ? prev : Array(10).fill(activeSessions)));
        };

        seedSeries();

        const interval = setInterval(() => {
            const parsePct = (s) => {
                const n = Number(String(s).replace('%',''));
                return Number.isFinite(n) ? n : 0;
            };
            if (!hasServerSeries) {
                setSeriesUsers((arr) => [...arr.slice(-9), totalUsers]);
                setSeriesUptime((arr) => [...arr.slice(-9), parsePct(systemUptime)]);
                setSeriesAlerts((arr) => [...arr.slice(-9), securityAlerts]);
                setSeriesSessions((arr) => [...arr.slice(-9), activeSessions]);
            }
        }, 60_000);

        return () => clearInterval(interval);
    }, [totalUsers, systemUptime, securityAlerts, activeSessions, hasServerSeries]);

    const greetingName = isLoaded && user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.username || 'Admin' : 'Admin';

    return (
        <>
            <div className="space-y-8">
                {/* Page Header moved to AdminGreeting in layout */}

                {/* Section for key statistics */}
                <div className="flex items-center justify-end pb-2">
                    <Button variant="ghost" size="sm" onClick={() => setCompact((v) => {
                        const nv = !v;
                        try { window.localStorage.setItem('admin:compact', nv ? '1' : '0'); } catch {}
                        return nv;
                    })} aria-pressed={compact}>
                        {compact ? 'Comfortable' : 'Compact'}
                    </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Total Users" value={totalUsers} tooltip="Count of users scoped to your organization." series={seriesUsers} compact={compact} />
                    <StatCard title="System Uptime" value={systemUptime} tooltip="Overall uptime reported by the platform. For demo purposes this is mocked." series={seriesUptime} compact={compact} />
                    <StatCard title="Security Alerts" value={securityAlerts} tooltip="Unread security alerts relevant to administrators." series={seriesAlerts} compact={compact} />
                    <StatCard title="Active Sessions" value={activeSessions} tooltip="Estimated online users in the last few minutes." series={seriesSessions} compact={compact} />
                </div>

                {/* Section for system health overview */}
                <div className="bg-card border border-border p-6 rounded-2xl">
                    <h2 className="font-bold text-lg text-foreground mb-4">System Health Overview</h2>
                    <div className="flex flex-col md:flex-row gap-6 mb-6">
                        <HealthCard title="Server Status" status="Online" value="99.9% uptime" icon={<ServerIcon />} tooltip="Web server availability and general health." compact={compact} />
                        <HealthCard title="Database" status="Healthy" value="120 ms avg response" statusColor="text-emerald-600/90" icon={<DatabaseIcon />} tooltip="Representative database health and latency." compact={compact} />
                    </div>
                    {/* Button to open the detailed metrics modal */}
                    <Button 
                        onClick={() => setShowMetricsModal(true)}
                        className="w-full"
                        variant="outline"
                    >
                        View Detailed Metrics
                    </Button>
                </div>

                {/* Section for recent admin activities */}
                <div className="bg-card border border-border p-6 rounded-2xl">
                    <h2 className="font-bold text-lg text-foreground mb-4">Recent Admin Activities</h2>
                    <div className="space-y-4 mb-6">
                        {recentActivities.map(activity => (
                            <ActivityItem key={activity.id} title={activity.action} description={activity.details} time={new Date(activity.timestamp).toLocaleString()} />
                        ))}
                    </div>
                    {/* Navigate to dedicated audit log page */}
                    <Button 
                        onClick={() => router.push('/admin/audit-logs')}
                        className="w-full"
                        variant="outline"
                    >View Full Audit Log</Button>
                </div>
            </div>

            {/* Conditionally render the modals based on their state */}
            {showMetricsModal && <DetailedMetricsModal onClose={() => setShowMetricsModal(false)} />}
        </>
    );
}
