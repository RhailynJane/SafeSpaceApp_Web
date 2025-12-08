"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Users, UserCheck, UserX, MessageCircle, BookOpen, Phone, TrendingUp, Calendar, Filter, AlertTriangle, CheckCircle, Activity } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

/**
 * Simple component to display client-support worker assignments
 * Shows which clients are assigned to which support workers
 */
export function ClientAssignmentList({ orgId, dbUserRec }) {
  const { user } = useUser();
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState({});
  const [analyticsClient, setAnalyticsClient] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showDetailedLogs, setShowDetailedLogs] = useState(false);
  const [detailedLogsClient, setDetailedLogsClient] = useState(null);
  const [activityFilter, setActivityFilter] = useState("all");
  const [dateRange, setDateRange] = useState("30"); // days
  
  // Journal analytics
  const [journalAnalyticsClient, setJournalAnalyticsClient] = useState(null);
  const [showJournalAnalytics, setShowJournalAnalytics] = useState(false);
  
  // Crisis analytics
  const [crisisAnalyticsClient, setCrisisAnalyticsClient] = useState(null);
  const [showCrisisAnalytics, setShowCrisisAnalytics] = useState(false);
  
  const bulkAssignClients = useMutation(api.clients.bulkAssignClients);
  const assignToSupportWorker = useMutation(api.clients.assignToSupportWorker);

  // Stable callbacks for dialog close handlers
  const handleAnalyticsDialogChange = useCallback((open) => {
    setShowAnalytics(open);
    if (!open) setAnalyticsClient(null);
  }, []);

  const handleDetailedLogsDialogChange = useCallback((open) => {
    setShowDetailedLogs(open);
    if (!open) setDetailedLogsClient(null);
  }, []);

  const handleJournalAnalyticsDialogChange = useCallback((open) => {
    setShowJournalAnalytics(open);
    if (!open) setJournalAnalyticsClient(null);
  }, []);

  const handleCrisisAnalyticsDialogChange = useCallback((open) => {
    setShowCrisisAnalytics(open);
    if (!open) setCrisisAnalyticsClient(null);
  }, []);

  // Memoize date calculations to prevent infinite re-renders
  const dateRangeParams = useMemo(() => {
    const endDate = Date.now();
    const startDate = endDate - parseInt(dateRange) * 24 * 60 * 60 * 1000;
    return { startDate, endDate };
  }, [dateRange]);

  // Only team leaders and admins can assign
  const isTeamLeader = dbUserRec?.roleId === "team_leader" || dbUserRec?.roleId === "admin" || dbUserRec?.roleId === "superadmin";

  // Fetch client assignments with worker details
  const clientAssignments = useQuery(
    api.clients.getClientAssignments,
    user?.id && orgId ? { clerkId: user.id, orgId } : "skip"
  );

  // Fetch support worker loads
  const workerLoads = useQuery(
    api.clients.getSupportWorkerLoad,
    user?.id && orgId ? { clerkId: user.id, orgId } : "skip"
  );

  // Fetch client statistics - ALWAYS show all clients
  const clientStats = useQuery(
    api.clients.getClientStatistics,
    user?.id && orgId ? { clerkId: user.id, orgId } : "skip"
  );

  // Fetch detailed analytics when viewing client analytics
  const clientAnalytics = useQuery(
    api.clients.getClientAnalytics,
    showAnalytics && analyticsClient?.clerkId && user?.id ? 
      { clerkId: user.id, clientUserId: analyticsClient.clerkId } : "skip"
  );

  // Fetch journal analytics
  const journalAnalytics = useQuery(
    api.clients.getJournalAnalytics,
    showJournalAnalytics && journalAnalyticsClient?.clerkId && user?.id ?
      { clerkId: user.id, clientUserId: journalAnalyticsClient.clerkId } : "skip"
  );

  // Fetch crisis analytics
  const crisisAnalytics = useQuery(
    api.clients.getCrisisAnalytics,
    showCrisisAnalytics && crisisAnalyticsClient?.clerkId && user?.id ?
      { clerkId: user.id, clientUserId: crisisAnalyticsClient.clerkId } : "skip"
  );

  // Fetch detailed logs when viewing detailed view
  const detailedLogs = useQuery(
    api.clients.getClientDetailedLogs,
    showDetailedLogs && detailedLogsClient?.clerkId && user?.id ?
      {
        clerkId: user.id,
        clientUserId: detailedLogsClient.clerkId,
        activityType: activityFilter,
        startDate: dateRangeParams.startDate,
        endDate: dateRangeParams.endDate,
        limit: 100,
        offset: 0,
      } : "skip"
  );

  const assignedClients = clientAssignments?.filter(c => c.assignedUserId && c.assignedUserId.trim() !== "") || [];
  const unassignedClients = clientAssignments?.filter(c => !c.assignedUserId || c.assignedUserId.trim() === "") || [];

  const handleBulkAssign = async () => {
    if (!user?.id || !orgId) return;
    
    console.log("Bulk assign - starting with:", { 
      userId: user.id, 
      orgId,
      unassignedCount: unassignedClients.length,
      unassignedClients: unassignedClients.map(c => ({ 
        id: c._id, 
        name: `${c.firstName} ${c.lastName}`,
        assignedUserId: c.assignedUserId 
      }))
    });
    
    setIsAssigning(true);
    try {
      const result = await bulkAssignClients({
        clerkId: user.id,
        orgId,
      });
      console.log("Bulk assign result:", result);
      // The UI will auto-refresh via Convex subscriptions
    } catch (error) {
      console.error("Error assigning clients:", error);
      alert("Error assigning clients: " + error.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleManualAssign = async (clientId, workerClerkId) => {
    if (!user?.id || !workerClerkId) {
      console.log("Manual assign - missing data:", { userId: user?.id, clientId, workerClerkId });
      return;
    }
    
    console.log("Manual assign - calling mutation:", { userId: user.id, clientId, workerClerkId });
    
    try {
      const result = await assignToSupportWorker({
        clerkId: user.id,
        clientId,
        supportWorkerId: workerClerkId,
      });
      console.log("Manual assign - success:", result);
      // Clear selection
      setSelectedWorker(prev => ({ ...prev, [clientId]: "" }));
    } catch (error) {
      console.error("Error assigning client:", error);
      alert("Error assigning client: " + error.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clientAssignments?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-600" />
              Assigned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {assignedClients.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserX className="h-4 w-4 text-orange-600" />
              Unassigned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {unassignedClients.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Support Worker Distribution */}
      {workerLoads && workerLoads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Support Worker Assignments</CardTitle>
            <CardDescription>Client distribution across support workers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workerLoads.map((worker) => (
                <div key={worker.clerkId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">
                      {worker.firstName} {worker.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{worker.email}</p>
                    
                    {/* Show assigned client names */}
                    {worker.clients && worker.clients.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {worker.clients.map((client) => (
                          <Badge key={client._id} variant="outline" className="text-xs">
                            {client.firstName} {client.lastName}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Badge 
                    variant={worker.clientCount === 0 ? "secondary" : "default"}
                    className="ml-4"
                  >
                    {worker.clientCount} {worker.clientCount === 1 ? "client" : "clients"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unassigned Clients Warning - Only show to team leaders */}
      {unassignedClients.length > 0 && isTeamLeader && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <UserX className="h-5 w-5" />
              Unassigned Clients ({unassignedClients.length})
            </CardTitle>
            <CardDescription className="text-orange-700">
              These clients need to be assigned to a support worker
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {unassignedClients.map((client) => (
                <div key={client._id} className="flex items-center justify-between gap-3 p-3 bg-white rounded border border-orange-200">
                  <div className="flex-1">
                    <p className="font-medium">{client.firstName} {client.lastName}</p>
                    <p className="text-sm text-muted-foreground">{client.email}</p>
                  </div>
                  <div className="flex gap-2">
                    {/* Manual assignment dropdown */}
                    <select
                      value={selectedWorker[client._id] || ""}
                      onChange={(e) => setSelectedWorker(prev => ({ ...prev, [client._id]: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="">Select Worker</option>
                      {workerLoads?.map((worker) => (
                        <option key={worker.clerkId} value={worker.clerkId}>
                          {worker.firstName} {worker.lastName} ({worker.clientCount})
                        </option>
                      ))}
                    </select>
                    <Button
                      onClick={() => handleManualAssign(client._id, selectedWorker[client._id])}
                      disabled={!selectedWorker[client._id]}
                      size="sm"
                      variant="outline"
                    >
                      Assign
                    </Button>
                  </div>
                </div>
              ))}
              
              {/* Bulk assign button */}
              <Button 
                onClick={handleBulkAssign}
                disabled={isAssigning}
                className="w-full mt-4"
                variant="secondary"
              >
                {isAssigning ? "Assigning..." : "Auto-Assign All to Least-Loaded Workers"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Assignments Detail View */}
      <Card>
        <CardHeader>
          <CardTitle>All Client Assignments</CardTitle>
          <CardDescription>Complete list of client-support worker assignments with activity statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {clientAssignments && clientAssignments.length > 0 ? (
              clientAssignments.map((client) => {
                // Find stats or create empty stats for clients without activity
                const stats = clientStats?.find(s => s.clientId === client.clerkId) || {
                  clientId: client.clerkId,
                  moodSharedCount: 0,
                  journalSharedCount: 0,
                  crisisCallCount: 0,
                  totalSharedCount: 0,
                };
                
                return (
                  <div
                    key={client._id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {client.firstName} {client.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{client.email}</p>
                      
                      {/* Statistics - ALWAYS SHOW */}
                      <div className="flex gap-4 mt-2">
                        <div className="flex items-center gap-1 text-xs">
                          <MessageCircle className="h-3 w-3 text-blue-600" />
                          <span className="font-medium">{stats.moodSharedCount}</span>
                          <span className="text-muted-foreground">Moods</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs opacity-50" title="Coming soon">
                          <BookOpen className="h-3 w-3 text-purple-600" />
                          <span className="font-medium">0</span>
                          <span className="text-muted-foreground">Journals</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <Phone className="h-3 w-3 text-red-600" />
                          <span className="font-medium">{stats.crisisCallCount}</span>
                          <span className="text-muted-foreground">Crisis</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {/* Analytics Button - ALWAYS SHOW */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAnalyticsClient({
                            ...stats,
                            firstName: client.firstName,
                            lastName: client.lastName,
                            email: client.email,
                            clerkId: client.clerkId
                          });
                          setShowAnalytics(true);
                        }}
                        className="gap-1"
                      >
                        <TrendingUp className="h-3 w-3" />
                        Mood
                      </Button>

                      {/* Journal Analytics Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setJournalAnalyticsClient({
                            firstName: client.firstName,
                            lastName: client.lastName,
                            email: client.email,
                            clerkId: client.clerkId
                          });
                          setShowJournalAnalytics(true);
                        }}
                        className="gap-1"
                      >
                        <BookOpen className="h-3 w-3" />
                        Journal
                      </Button>

                      {/* Crisis Analytics Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCrisisAnalyticsClient({
                            firstName: client.firstName,
                            lastName: client.lastName,
                            email: client.email,
                            clerkId: client.clerkId
                          });
                          setShowCrisisAnalytics(true);
                        }}
                        className="gap-1"
                      >
                        <Phone className="h-3 w-3" />
                        Crisis
                      </Button>
                      
                      {/* Assigned Worker */}
                      <div className="text-right min-w-[150px]">
                        {client.assignedWorker ? (
                          <div>
                            <p className="text-sm font-medium text-green-700">
                              {client.assignedWorker.firstName} {client.assignedWorker.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {client.assignedWorker.email}
                            </p>
                          </div>
                        ) : (
                          <Badge variant="secondary">Not Assigned</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-muted-foreground py-8">No clients found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Analytics Dialog */}
      <Dialog open={showAnalytics} onOpenChange={handleAnalyticsDialogChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Client Analytics: {analyticsClient?.firstName} {analyticsClient?.lastName}
            </DialogTitle>
            <DialogDescription>
              Comprehensive risk analysis, activity insights, and AI-powered recommendations
            </DialogDescription>
          </DialogHeader>
          
          {analyticsClient && (
            <div className="space-y-6">
              {/* Risk Level Badge */}
              {clientAnalytics && (
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Risk Assessment</p>
                      <Badge 
                        className={`mt-2 px-4 py-1 text-sm font-bold ${
                          clientAnalytics.riskLevel === 'critical' ? 'bg-red-600 hover:bg-red-700' :
                          clientAnalytics.riskLevel === 'high' ? 'bg-orange-500 hover:bg-orange-600' :
                          clientAnalytics.riskLevel === 'moderate' ? 'bg-yellow-500 hover:bg-yellow-600' :
                          'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {clientAnalytics.riskLevel.charAt(0).toUpperCase() + clientAnalytics.riskLevel.slice(1)}
                      </Badge>
                    </div>
                    
                    {/* Trend Indicator */}
                    {clientAnalytics.metrics.trend && (
                      <div>
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Trend</p>
                        <div className={`mt-2 px-3 py-1 rounded-md font-semibold text-sm ${
                          clientAnalytics.metrics.trend === 'improving' ? 'bg-green-100 text-green-800' :
                          clientAnalytics.metrics.trend === 'declining' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {clientAnalytics.metrics.trend === 'improving' && '↑ '}
                          {clientAnalytics.metrics.trend === 'declining' && '↓ '}
                          {clientAnalytics.metrics.trend === 'stable' && '→ '}
                          {clientAnalytics.metrics.trend.charAt(0).toUpperCase() + clientAnalytics.metrics.trend.slice(1)}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    size="sm"
                    className="bg-slate-800 hover:bg-slate-900"
                    onClick={() => {
                      setDetailedLogsClient(analyticsClient);
                      setShowDetailedLogs(true);
                    }}
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Activity Log
                  </Button>
                </div>
              )}

              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-blue-600" />
                      Moods
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {clientAnalytics?.metrics.totalMoods || analyticsClient.moodSharedCount}
                    </div>
                    {clientAnalytics?.metrics.shareRate !== undefined && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.round(clientAnalytics.metrics.shareRate)}% shared
                      </p>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      Avg Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {clientAnalytics?.metrics.avgMoodScore 
                        ? clientAnalytics.metrics.avgMoodScore.toFixed(1)
                        : 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-teal-600" />
                      Journals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-teal-600">0</div>
                    <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Phone className="h-4 w-4 text-red-600" />
                      Crisis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {clientAnalytics?.metrics.crisisCallCount || analyticsClient.crisisCallCount}
                    </div>
                    {clientAnalytics?.metrics.recentCrisisCount > 0 && (
                      <p className="text-xs text-red-600 font-medium mt-1">
                        {clientAnalytics.metrics.recentCrisisCount} recent
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Risk Factors */}
              {clientAnalytics && clientAnalytics.riskFactors.length > 0 && (
                <Card className={`border-2 ${
                  clientAnalytics.riskLevel === 'critical' ? 'border-red-300 bg-red-50' :
                  clientAnalytics.riskLevel === 'high' ? 'border-orange-300 bg-orange-50' :
                  clientAnalytics.riskLevel === 'moderate' ? 'border-yellow-300 bg-yellow-50' :
                  'border-green-300 bg-green-50'
                }`}>
                  <CardHeader className="pb-3">
                    <CardTitle className={`text-base flex items-center gap-2 ${
                      clientAnalytics.riskLevel === 'critical' || clientAnalytics.riskLevel === 'high' 
                        ? 'text-red-900' 
                        : clientAnalytics.riskLevel === 'moderate'
                        ? 'text-yellow-900'
                        : 'text-green-900'
                    }`}>
                      {clientAnalytics.riskLevel === 'critical' && <AlertTriangle className="h-5 w-5" />}
                      {clientAnalytics.riskLevel === 'high' && <AlertTriangle className="h-5 w-5" />}
                      {clientAnalytics.riskLevel === 'moderate' && <AlertTriangle className="h-5 w-5" />}
                      {clientAnalytics.riskLevel === 'low' && <CheckCircle className="h-5 w-5 text-green-700" />}
                      Key Risk Indicators
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {clientAnalytics.riskFactors.map((factor, idx) => (
                        <div key={idx} className={`p-3 rounded-lg border-l-4 ${
                          clientAnalytics.riskLevel === 'critical' || clientAnalytics.riskLevel === 'high'
                            ? 'bg-red-100 text-red-900 border-l-red-600'
                            : clientAnalytics.riskLevel === 'moderate'
                            ? 'bg-yellow-100 text-yellow-900 border-l-yellow-600'
                            : 'bg-green-100 text-green-900 border-l-green-600'
                        }`}>
                          <p className="text-sm font-medium leading-relaxed">{factor}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* AI Recommendations */}
              {clientAnalytics && clientAnalytics.recommendations.length > 0 && (
                <Card className="border-slate-300 bg-slate-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                      Recommended Actions
                    </CardTitle>
                    <CardDescription className="text-slate-600">Prioritized next steps based on risk assessment</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {clientAnalytics.recommendations.map((rec, idx) => (
                        <div key={idx} className="flex gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-300 transition-colors">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                            {idx + 1}
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed pt-0.5">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top Mood Factors */}
              {clientAnalytics && clientAnalytics.topFactors.length > 0 && (
                <Card className="border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-slate-900">Top Mood Triggers</CardTitle>
                    <CardDescription>Most frequently cited factors influencing mood (Last 30 Days)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {clientAnalytics.topFactors.map((factor, idx) => {
                        const maxCount = Math.max(...clientAnalytics.topFactors.map(f => f.count));
                        const percentage = (factor.count / maxCount) * 100;
                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-semibold text-slate-900 capitalize">{factor.factor}</span>
                              <Badge className="bg-blue-600 text-white border-0">{factor.count}x</Badge>
                            </div>
                            <div className="w-full bg-slate-300 rounded-full h-2 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all" 
                                style={{width: `${percentage}%`}}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Mood Distribution */}
              {clientAnalytics && clientAnalytics.moodDistribution.length > 0 && (
                <Card className="border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-slate-900">Mood Breakdown</CardTitle>
                    <CardDescription>Distribution of mood entries by type (Last 30 Days)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {clientAnalytics.moodDistribution.map((mood, idx) => {
                        const maxCount = Math.max(...clientAnalytics.moodDistribution.map(m => m.count));
                        const percentage = (mood.count / maxCount) * 100;
                        
                        // Color coding by mood type
                        const moodColors = {
                          'ecstatic': 'from-green-400 to-green-500',
                          'very-happy': 'from-green-300 to-green-400',
                          'happy': 'from-emerald-300 to-emerald-400',
                          'content': 'from-blue-300 to-blue-400',
                          'neutral': 'from-slate-300 to-slate-400',
                          'annoyed': 'from-yellow-300 to-yellow-400',
                          'sad': 'from-orange-300 to-orange-400',
                          'frustrated': 'from-red-300 to-red-400',
                          'angry': 'from-red-400 to-red-500'
                        };
                        
                        const colorClass = moodColors[mood.type] || 'from-slate-300 to-slate-400';
                        
                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-semibold text-slate-900 capitalize">{mood.type}</span>
                              <Badge className="bg-slate-700 text-white border-0">{mood.count}</Badge>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                              <div 
                                className={`bg-gradient-to-r ${colorClass} h-3 rounded-full transition-all`}
                                style={{width: `${percentage}%`}}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* No Data State */}
              {(!clientAnalytics || clientAnalytics.metrics.totalMoods === 0) && (
                <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100">
                  <CardContent className="text-center py-16">
                    <div className="flex justify-center mb-4">
                      <div className="p-4 bg-slate-200 rounded-full">
                        <Activity className="h-10 w-10 text-slate-500" />
                      </div>
                    </div>
                    <p className="text-slate-900 font-semibold text-base mb-2">No Activity Data Yet</p>
                    <p className="text-slate-600 text-sm max-w-xs mx-auto leading-relaxed">
                      Share mood entries to unlock personalized insights, risk assessment, and AI-powered recommendations to support your wellness journey.
                    </p>
                    <div className="mt-5 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800 font-medium">💡 Tip: Regular mood tracking helps identify patterns and triggers</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Detailed Activity Logs Dialog */}
      <Dialog open={showDetailedLogs} onOpenChange={handleDetailedLogsDialogChange}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              All Activity Logs: {detailedLogsClient?.firstName} {detailedLogsClient?.lastName}
            </DialogTitle>
            <DialogDescription>
              Comprehensive activity history with filtering options
            </DialogDescription>
          </DialogHeader>

          {detailedLogsClient && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex gap-4 items-center p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">Activity Type:</label>
                  <select
                    value={activityFilter}
                    onChange={(e) => setActivityFilter(e.target.value)}
                    className="border rounded px-3 py-1 text-sm"
                  >
                    <option value="all">All Activities</option>
                    <option value="moods">Moods Only</option>
                    <option value="journals">Journals Only</option>
                    <option value="crisis">Crisis Calls Only</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <label className="text-sm text-muted-foreground">Date Range:</label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="border rounded px-3 py-1 text-sm"
                  >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                  </select>
                </div>
              </div>

              {/* Activity List */}
              {detailedLogs && detailedLogs.activities && detailedLogs.activities.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      Showing {detailedLogs.activities.length} of {detailedLogs.total} activities
                    </p>
                    {detailedLogs.hasMore && (
                      <Badge variant="secondary">More available</Badge>
                    )}
                  </div>

                  {detailedLogs.activities.map((activity, idx) => (
                    <Card key={idx} className={`${
                      activity.type === 'crisis' ? 'border-red-300 bg-red-50' :
                      activity.type === 'journal' ? 'border-purple-300 bg-purple-50' :
                      'border-blue-300 bg-blue-50'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            {/* Activity Type Badge */}
                            <div className="flex items-center gap-2 mb-2">
                              {activity.type === 'mood' && (
                                <>
                                  <MessageCircle className="h-4 w-4 text-blue-600" />
                                  <Badge className="bg-blue-600">Mood Entry</Badge>
                                  <span className="text-lg">{activity.emoji}</span>
                                  <span className="font-medium capitalize">{activity.label || activity.moodType}</span>
                                </>
                              )}
                              {activity.type === 'journal' && (
                                <>
                                  <BookOpen className="h-4 w-4 text-purple-600" />
                                  <Badge className="bg-purple-600">Journal Entry</Badge>
                                  <span className="font-medium">{activity.title}</span>
                                </>
                              )}
                              {activity.type === 'crisis' && (
                                <>
                                  <Phone className="h-4 w-4 text-red-600" />
                                  <Badge className="bg-red-600">Crisis Call</Badge>
                                </>
                              )}
                            </div>

                            {/* Content */}
                            {activity.type === 'mood' && (
                              <div className="space-y-1">
                                {activity.notes && (
                                  <p className="text-sm text-gray-700">{activity.notes}</p>
                                )}
                                {activity.factors && activity.factors.length > 0 && (
                                  <div className="flex gap-1 flex-wrap">
                                    {activity.factors.map((factor, i) => (
                                      <Badge key={i} variant="outline" className="text-xs">
                                        {factor}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                            {activity.type === 'crisis' && activity.metadata && (
                              <p className="text-sm text-gray-700">{JSON.stringify(activity.metadata)}</p>
                            )}
                          </div>

                          {/* Timestamp */}
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              {new Date(activity.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(activity.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-gray-300 bg-gray-50">
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">
                      No activities found for the selected filters.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Journal Analytics Dialog */}
      <Dialog open={showJournalAnalytics} onOpenChange={handleJournalAnalyticsDialogChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Journal Analytics: {journalAnalyticsClient?.firstName} {journalAnalyticsClient?.lastName}
            </DialogTitle>
            <DialogDescription>
              Comprehensive journaling patterns, themes, and risk assessment
            </DialogDescription>
          </DialogHeader>

          {journalAnalyticsClient && journalAnalytics && (
            <div className="space-y-6">
              {/* Risk Level Badge */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase">Risk Assessment</p>
                    <Badge className={`mt-2 px-4 py-1 text-sm font-bold ${
                      journalAnalytics.riskLevel === 'critical' ? 'bg-red-600 hover:bg-red-700' :
                      journalAnalytics.riskLevel === 'high' ? 'bg-orange-600 hover:bg-orange-700' :
                      journalAnalytics.riskLevel === 'moderate' ? 'bg-yellow-600 hover:bg-yellow-700' :
                      'bg-green-600 hover:bg-green-700'
                    }`}>
                      {journalAnalytics.riskLevel}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase">Trend</p>
                    <div className={`mt-2 px-3 py-1 rounded-md font-semibold text-sm ${
                      journalAnalytics.metrics.trend === 'improving' ? 'bg-green-100 text-green-800' :
                      journalAnalytics.metrics.trend === 'declining' ? 'bg-red-100 text-red-800' :
                      'bg-slate-200 text-slate-800'
                    }`}>
                      {journalAnalytics.metrics.trend === 'improving' && '↑ '}
                      {journalAnalytics.metrics.trend === 'declining' && '↓ '}
                      {journalAnalytics.metrics.trend === 'stable' && '→ '}
                      {journalAnalytics.metrics.trend}
                    </div>
                  </div>
                </div>
              </div>

              {/* Journal Metrics */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-purple-600" />
                      Total
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {journalAnalytics.metrics.totalJournals}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">All entries</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      Recent
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {journalAnalytics.metrics.recentJournals}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-teal-600" />
                      Shared
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-teal-600">
                      {journalAnalytics.metrics.sharedJournals}
                    </div>
                    <p className="text-xs text-teal-600 font-medium mt-1">
                      {journalAnalytics.metrics.shareRate}% shared
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-indigo-600" />
                      Avg Words
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-indigo-600">
                      {journalAnalytics.metrics.avgWordsPerEntry}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Per entry</p>
                  </CardContent>
                </Card>
              </div>

              {/* Risk Factors */}
              {journalAnalytics.riskFactors.length > 0 && (
                <Card className={`border-2 ${
                  journalAnalytics.riskLevel === 'critical' ? 'border-red-300 bg-red-50' :
                  journalAnalytics.riskLevel === 'high' ? 'border-orange-300 bg-orange-50' :
                  journalAnalytics.riskLevel === 'moderate' ? 'border-yellow-300 bg-yellow-50' :
                  'border-green-300 bg-green-50'
                }`}>
                  <CardHeader className="pb-3">
                    <CardTitle className={`text-base flex items-center gap-2 ${
                      journalAnalytics.riskLevel === 'critical' || journalAnalytics.riskLevel === 'high' 
                        ? 'text-red-900' 
                        : journalAnalytics.riskLevel === 'moderate'
                        ? 'text-yellow-900'
                        : 'text-green-900'
                    }`}>
                      {journalAnalytics.riskLevel === 'critical' && <AlertTriangle className="h-5 w-5" />}
                      {journalAnalytics.riskLevel === 'high' && <AlertTriangle className="h-5 w-5" />}
                      {journalAnalytics.riskLevel === 'moderate' && <AlertTriangle className="h-5 w-5" />}
                      {journalAnalytics.riskLevel === 'low' && <CheckCircle className="h-5 w-5 text-green-700" />}
                      Key Risk Indicators
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {journalAnalytics.riskFactors.map((factor, idx) => (
                        <div key={idx} className={`p-3 rounded-lg border-l-4 ${
                          journalAnalytics.riskLevel === 'critical' || journalAnalytics.riskLevel === 'high'
                            ? 'bg-red-100 text-red-900 border-l-red-600'
                            : journalAnalytics.riskLevel === 'moderate'
                            ? 'bg-yellow-100 text-yellow-900 border-l-yellow-600'
                            : 'bg-green-100 text-green-900 border-l-green-600'
                        }`}>
                          <p className="text-sm font-medium leading-relaxed">{factor}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {journalAnalytics.recommendations.length > 0 && (
                <Card className="border-slate-300 bg-slate-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                      Recommended Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {journalAnalytics.recommendations.map((rec, idx) => (
                        <div key={idx} className="flex gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-300 transition-colors">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                            {idx + 1}
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed pt-0.5">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top Themes */}
              {journalAnalytics.topThemes.length > 0 && (
                <Card className="border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-slate-900">Top Themes</CardTitle>
                    <CardDescription>Most frequently mentioned topics (Last 30 Days)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {journalAnalytics.topThemes.map((theme, idx) => {
                        const maxCount = Math.max(...journalAnalytics.topThemes.map(t => t.count));
                        const percentage = (theme.count / maxCount) * 100;
                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-semibold text-slate-900 capitalize">{theme.theme}</span>
                              <Badge className="bg-purple-600 text-white border-0">{theme.count}x</Badge>
                            </div>
                            <div className="w-full bg-slate-300 rounded-full h-2 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all" 
                                style={{width: `${percentage}%`}}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Engagement Trend */}
              {journalAnalytics.engagementTrend && (
                <Card className="border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-slate-900">Engagement Trend</CardTitle>
                    <CardDescription>7-day comparison of journaling activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-4">
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-600 uppercase mb-2">Previous 7 Days</p>
                        <div className="flex items-center gap-2">
                          <div className="text-2xl font-bold text-slate-700">{journalAnalytics.engagementTrend.previous7Days}</div>
                          <span className="text-xs text-slate-600">entries</span>
                        </div>
                      </div>
                      <div className={`text-2xl font-bold ${
                        journalAnalytics.engagementTrend.trend === 'improving' ? 'text-green-600' :
                        journalAnalytics.engagementTrend.trend === 'declining' ? 'text-red-600' :
                        'text-slate-600'
                      }`}>
                        {journalAnalytics.engagementTrend.trend === 'improving' && '↑'}
                        {journalAnalytics.engagementTrend.trend === 'declining' && '↓'}
                        {journalAnalytics.engagementTrend.trend === 'stable' && '→'}
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-xs font-semibold text-slate-600 uppercase mb-2">Last 7 Days</p>
                        <div className="flex items-center gap-2 justify-end">
                          <div className="text-2xl font-bold text-slate-700">{journalAnalytics.engagementTrend.last7Days}</div>
                          <span className="text-xs text-slate-600">entries</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Crisis Analytics Dialog */}
      <Dialog open={showCrisisAnalytics} onOpenChange={handleCrisisAnalyticsDialogChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Crisis Support Analytics: {crisisAnalyticsClient?.firstName} {crisisAnalyticsClient?.lastName}
            </DialogTitle>
            <DialogDescription>
              Crisis incidents, risk assessment, and intervention tracking
            </DialogDescription>
          </DialogHeader>

          {crisisAnalyticsClient && crisisAnalytics && (
            <div className="space-y-6">
              {/* Risk Level Badge */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase">Risk Assessment</p>
                    <Badge className={`mt-2 px-4 py-1 text-sm font-bold ${
                      crisisAnalytics.riskLevel === 'critical' ? 'bg-red-600 hover:bg-red-700' :
                      crisisAnalytics.riskLevel === 'high' ? 'bg-orange-600 hover:bg-orange-700' :
                      crisisAnalytics.riskLevel === 'moderate' ? 'bg-yellow-600 hover:bg-yellow-700' :
                      'bg-green-600 hover:bg-green-700'
                    }`}>
                      {crisisAnalytics.riskLevel}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase">Trend</p>
                    <div className={`mt-2 px-3 py-1 rounded-md font-semibold text-sm ${
                      crisisAnalytics.metrics.trend === 'increasing' ? 'bg-red-100 text-red-800' :
                      crisisAnalytics.metrics.trend === 'decreasing' ? 'bg-green-100 text-green-800' :
                      'bg-slate-200 text-slate-800'
                    }`}>
                      {crisisAnalytics.metrics.trend === 'increasing' && '↑ '}
                      {crisisAnalytics.metrics.trend === 'decreasing' && '↓ '}
                      {crisisAnalytics.metrics.trend === 'stable' && '→ '}
                      {crisisAnalytics.metrics.trend}
                    </div>
                  </div>
                </div>
              </div>

              {/* Crisis Timeline Metrics */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Phone className="h-4 w-4 text-red-600" />
                      All Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {crisisAnalytics.timeline.allTime}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Total incidents</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-orange-600" />
                      30 Days
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {crisisAnalytics.timeline.last30Days}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Recent incidents</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      7 Days
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {crisisAnalytics.timeline.last7Days}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">This week</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-700" />
                      24 Hours
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-700">
                      {crisisAnalytics.timeline.last24Hours}
                    </div>
                    <p className="text-xs text-red-600 font-medium mt-1">
                      {crisisAnalytics.timeline.last24Hours > 0 ? 'Immediate action' : 'Stable'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Risk Factors */}
              {crisisAnalytics.riskFactors.length > 0 && (
                <Card className={`border-2 ${
                  crisisAnalytics.riskLevel === 'critical' ? 'border-red-300 bg-red-50' :
                  crisisAnalytics.riskLevel === 'high' ? 'border-orange-300 bg-orange-50' :
                  crisisAnalytics.riskLevel === 'moderate' ? 'border-yellow-300 bg-yellow-50' :
                  'border-green-300 bg-green-50'
                }`}>
                  <CardHeader className="pb-3">
                    <CardTitle className={`text-base flex items-center gap-2 ${
                      crisisAnalytics.riskLevel === 'critical' || crisisAnalytics.riskLevel === 'high' 
                        ? 'text-red-900' 
                        : crisisAnalytics.riskLevel === 'moderate'
                        ? 'text-yellow-900'
                        : 'text-green-900'
                    }`}>
                      {crisisAnalytics.riskLevel === 'critical' && <AlertTriangle className="h-5 w-5" />}
                      {crisisAnalytics.riskLevel === 'high' && <AlertTriangle className="h-5 w-5" />}
                      {crisisAnalytics.riskLevel === 'moderate' && <AlertTriangle className="h-5 w-5" />}
                      {crisisAnalytics.riskLevel === 'low' && <CheckCircle className="h-5 w-5 text-green-700" />}
                      Key Risk Indicators
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {crisisAnalytics.riskFactors.map((factor, idx) => (
                        <div key={idx} className={`p-3 rounded-lg border-l-4 ${
                          crisisAnalytics.riskLevel === 'critical' || crisisAnalytics.riskLevel === 'high'
                            ? 'bg-red-100 text-red-900 border-l-red-600'
                            : crisisAnalytics.riskLevel === 'moderate'
                            ? 'bg-yellow-100 text-yellow-900 border-l-yellow-600'
                            : 'bg-green-100 text-green-900 border-l-green-600'
                        }`}>
                          <p className="text-sm font-medium leading-relaxed">{factor}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {crisisAnalytics.recommendations.length > 0 && (
                <Card className="border-slate-300 bg-slate-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                      Recommended Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {crisisAnalytics.recommendations.map((rec, idx) => (
                        <div key={idx} className="flex gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-300 transition-colors">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                            {idx + 1}
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed pt-0.5">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top Crisis Reasons */}
              {crisisAnalytics.topReasons.length > 0 && (
                <Card className="border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-slate-900">Top Crisis Triggers</CardTitle>
                    <CardDescription>Most frequently cited reasons for crisis support (Last 30 Days)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {crisisAnalytics.topReasons.map((reason, idx) => {
                        const maxCount = Math.max(...crisisAnalytics.topReasons.map(r => r.count));
                        const percentage = (reason.count / maxCount) * 100;
                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-semibold text-slate-900 capitalize">{reason.reason}</span>
                              <Badge className="bg-red-600 text-white border-0">{reason.count}x</Badge>
                            </div>
                            <div className="w-full bg-slate-300 rounded-full h-2 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all" 
                                style={{width: `${percentage}%`}}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
