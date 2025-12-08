"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Users, UserCheck, UserX } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";

/**
 * Simple component to display client-support worker assignments
 * Shows which clients are assigned to which support workers
 */
export function ClientAssignmentList({ orgId, dbUserRec }) {
  const { user } = useUser();
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState({});
  const bulkAssignClients = useMutation(api.clients.bulkAssignClients);
  const assignToSupportWorker = useMutation(api.clients.assignToSupportWorker);

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
          <CardDescription>Complete list of client-support worker assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {clientAssignments && clientAssignments.length > 0 ? (
              clientAssignments.map((client) => (
                <div
                  key={client._id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">
                      {client.firstName} {client.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{client.email}</p>
                  </div>
                  <div className="text-right">
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
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No clients found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
