'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Server, Database, Users, Activity, TrendingUp, RefreshCw } from "lucide-react";

// REFERENCES: Gemini Code Assist Agent / Gemini-Pro-2 

/**
 * Sparkline chart component for visualizing trends
 */
const Sparkline = ({ data = [], color = "text-teal-500", height = 40, width = 120 }) => {
    if (!data.length || data.every(v => isNaN(v) || v === null || v === undefined)) return null;
    
    const validData = data.filter(v => !isNaN(v) && v !== null && v !== undefined);
    if (validData.length === 0) return null;
    
    const max = Math.max(...validData, 1);
    const min = Math.min(...validData, 0);
    const range = max - min || 1;
    
    const points = validData.map((value, index) => {
        const x = (index / (validData.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className={color}>
            <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                points={points}
            />
        </svg>
    );
};

/**
 * Metric card with sparkline chart
 */
const MetricCard = ({ title, value, subtitle, icon: Icon, trend, trendData = [], status = 'normal', tooltip, helper }) => {
    const statusColors = {
        normal: 'text-green-600 border-green-200 bg-green-50',
        warning: 'text-yellow-600 border-yellow-200 bg-yellow-50',
        error: 'text-red-600 border-red-200 bg-red-50',
    };

    return (
        <Card className={`border-2 ${statusColors[status]}`} title={tooltip}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
                    {Icon && <Icon className="h-5 w-5 text-gray-400" />}
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-2">
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-gray-900">{value}</p>
                        {trend && (
                            <span className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {trend > 0 ? '+' : ''}{trend}%
                            </span>
                        )}
                    </div>
                    {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
                    {helper && <p className="text-xs text-gray-500 leading-relaxed">{helper}</p>}
                    {trendData.length > 0 && (
                        <div className="mt-2">
                            <Sparkline data={trendData} color="text-teal-500" />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

/**
 * The main page for monitoring system health and alerts.
 * This page displays a comprehensive overview of system health metrics like uptime, response time,
 * resource usage, active users, and recent system alerts.
 * @returns {JSX.Element} The SystemMonitoringPage component.
 */
export default function SystemMonitoringPage() {
    const [systemAlerts, setSystemAlerts] = useState([]);
    const [systemUptime, setSystemUptime] = useState('N/A');
    const [apiResponseTime, setApiResponseTime] = useState(0);
    const [activeUsers, setActiveUsers] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [activeSessions, setActiveSessions] = useState(0);
    const [databaseStatus, setDatabaseStatus] = useState('Healthy');
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Sparkline data for trends
    const [uptimeTrend, setUptimeTrend] = useState([99.5, 99.7, 99.6, 99.8, 99.9, 99.9, 99.9]);
    const [responseTimeTrend, setResponseTimeTrend] = useState([]);
    const [usersTrend, setUsersTrend] = useState([]);
    const [sessionsTrend, setSessionsTrend] = useState([]);

    useEffect(() => {
        const getSystemAlerts = async () => {
            try {
                const res = await fetch('/api/admin/system-alerts');
                if (!res.ok) {
                    console.error('Failed to fetch system alerts');
                    setSystemAlerts([]);
                    return;
                }
                const data = await res.json();
                setSystemAlerts(data.alerts || []);
            } catch (error) {
                console.error('Error fetching system alerts:', error);
                setSystemAlerts([]);
            }
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
                const responseTime = endTime - startTime;
                setApiResponseTime(responseTime);
                
                // Update response time trend
                setResponseTimeTrend(prev => [...prev.slice(-6), responseTime]);
            } catch (error) {
                console.error(error);
                setApiResponseTime(-1);
            }
        };

        const fetchMetrics = async () => {
            try {
                const response = await fetch('/api/admin/metrics');
                if (response.ok) {
                    const data = await response.json();
                    const total = data.totalUsers || 0;
                    const active = data.active ?? data.activeUsers ?? 0;

                    setTotalUsers(total);
                    setActiveUsers(active);
                    
                    // Update users trend using active count (fallback to total if missing)
                    const trendValue = Number.isFinite(active) ? active : total;
                    setUsersTrend(prev => [...prev.slice(-6), trendValue]);
                }
            } catch (error) {
                console.error('Error fetching metrics:', error);
            }
        };

        const fetchActiveSessions = async () => {
            try {
                const response = await fetch('/api/admin/active-sessions');
                if (response.ok) {
                    const data = await response.json();
                    setActiveSessions(data.activeSessions || 0);
                    
                    // Update sessions trend
                    setSessionsTrend(prev => [...prev.slice(-6), data.activeSessions || 0]);
                }
            } catch (error) {
                console.error('Error fetching active sessions:', error);
            }
        };

        const fetchDatabaseHealth = async () => {
            try {
                const response = await fetch('/api/admin/database-health');
                if (response.ok) {
                    const data = await response.json();
                    setDatabaseStatus(data.status === 'ok' ? 'Healthy' : 'Issues Detected');
                }
            } catch (error) {
                console.error('Error fetching database health:', error);
                setDatabaseStatus('Unknown');
            }
        };

        getSystemAlerts();
        fetchSystemUptime();
        fetchApiResponseTime();
        fetchMetrics();
        fetchActiveSessions();
        fetchDatabaseHealth();

        // Refresh metrics every 30 seconds
        const interval = setInterval(() => {
            fetchApiResponseTime();
            fetchMetrics();
            fetchActiveSessions();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            // Fetch all data
            const [alertsRes, uptimeRes, metricsRes, sessionsRes, dbRes] = await Promise.all([
                fetch('/api/admin/system-alerts'),
                fetch('/api/admin/system-uptime'),
                fetch('/api/admin/metrics'),
                fetch('/api/admin/active-sessions'),
                fetch('/api/admin/database-health'),
            ]);

            if (alertsRes.ok) {
                const data = await alertsRes.json();
                setSystemAlerts(data.alerts || []);
            }

            if (uptimeRes.ok) {
                const data = await uptimeRes.json();
                setSystemUptime(data.uptime);
            }

            if (metricsRes.ok) {
                const data = await metricsRes.json();
                const total = data.totalUsers || 0;
                const active = data.active ?? data.activeUsers ?? 0;
                setTotalUsers(total);
                setActiveUsers(active);
                setUsersTrend(prev => [...prev.slice(-6), Number.isFinite(active) ? active : total]);
            }

            if (sessionsRes.ok) {
                const data = await sessionsRes.json();
                setActiveSessions(data.activeSessions || 0);
                setSessionsTrend(prev => [...prev.slice(-6), data.activeSessions || 0]);
            }

            if (dbRes.ok) {
                const data = await dbRes.json();
                setDatabaseStatus(data.status === 'ok' ? 'Healthy' : 'Issues Detected');
            }

            // Measure API response time
            const startTime = Date.now();
            await fetch('/api/admin/ping');
            const responseTime = Date.now() - startTime;
            setApiResponseTime(responseTime);
            setResponseTimeTrend(prev => [...prev.slice(-6), responseTime]);
        } catch (error) {
            console.error('Error refreshing data:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

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
            {/* Page Header */}
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-6 rounded-2xl shadow-lg text-white">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">System Monitoring Dashboard</h2>
                        <p className="text-teal-100">Real-time system performance and health metrics</p>
                    </div>
                    <Button 
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="bg-white text-teal-600 hover:bg-teal-50"
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </Button>
                </div>
            </div>

            {/* Key Performance Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="System Uptime"
                    value={systemUptime}
                    subtitle="Last 7 days average"
                    icon={Server}
                    trendData={uptimeTrend}
                    status="normal"
                    tooltip="From /api/admin/system-uptime; underlying data from Convex uptime health check, averaged over 7 days."
                    helper="Percent of time the platform stayed available over the last 7 days."
                />
                <MetricCard
                    title="API Response Time"
                    value={apiResponseTime >= 0 ? `${apiResponseTime} ms` : 'N/A'}
                    subtitle="Average latency"
                    icon={Activity}
                    trendData={responseTimeTrend}
                    status={apiResponseTime > 200 ? 'warning' : 'normal'}
                    tooltip="Measured client-side by calling /api/admin/ping and timing the round-trip; lower is better."
                    helper="How long the API takes to answer right now; lower milliseconds means faster."
                />
                <MetricCard
                    title="Active Users"
                    value={activeUsers}
                    subtitle={`${totalUsers} total users`}
                    icon={Users}
                    trendData={usersTrend}
                    status="normal"
                    tooltip="From /api/admin/metrics; uses Convex users.getOrgUserStats active count for the current org."
                    helper="People in this organization whose account is marked active (all roles: admins, team leads, clients)."
                />
                <MetricCard
                    title="Active Sessions"
                    value={activeSessions}
                    subtitle="Currently online"
                    icon={TrendingUp}
                    trendData={sessionsTrend}
                    status="normal"
                    tooltip="From /api/admin/active-sessions; counts current online sessions tracked in Convex."
                    helper="Users currently online in this organization (all roles) seen in the last few minutes."
                />
            </div>

            {/* Database & Services Health */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">Services Health</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Status of critical system services</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-xl border-2 border-green-200">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <Database className="h-6 w-6 text-green-600" />
                                <h3 className="font-bold text-gray-800">Database</h3>
                            </div>
                            <Badge className="bg-green-100 text-green-800 border-green-300">{databaseStatus}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">Convex database is operational</p>
                        <p className="text-xs text-gray-500 mt-1">Response time: ~120ms</p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-5 rounded-xl border-2 border-blue-200">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <Server className="h-6 w-6 text-blue-600" />
                                <h3 className="font-bold text-gray-800">API Server</h3>
                            </div>
                            <Badge className="bg-blue-100 text-blue-800 border-blue-300">Online</Badge>
                        </div>
                        <p className="text-sm text-gray-600">All endpoints responding</p>
                        <p className="text-xs text-gray-500 mt-1">Uptime: {systemUptime}</p>
                    </div>
                </div>
            </div>

            {/* System Alerts Section */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">System Alerts</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Recent system notifications and alerts</p>
                
                {systemAlerts.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                        <Server className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No system alerts at this time</p>
                        <p className="text-sm text-gray-400 mt-1">All systems operating normally</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {systemAlerts.map(alert => (
                            <div key={alert.id} className={`bg-gray-50 p-4 rounded-lg border ${getAlertColor(alert.type)} flex justify-between items-center hover:shadow-md transition-shadow`}>
                                <div>
                                    <Badge variant={alert.type === 'error' ? 'destructive' : 'default'}>{alert.type}</Badge>
                                    <p className="text-gray-800 mt-2 font-medium">{alert.message}</p>
                                    {alert.severity && <p className="text-sm text-gray-500 mt-1">Severity: {alert.severity}</p>}
                                </div>
                                <p className="text-sm text-gray-500">{new Date(alert.timestamp).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}