"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Users, UserCheck, UserX } from "lucide-react";

/**
 * Simple component to display client-support worker assignments
 * Shows which clients are assigned to which support workers
 */
export function ClientAssignmentList({ orgId }) {
  const { user } = useUser();

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

  const assignedClients = clientAssignments?.filter(c => c.assignedUserId) || [];
  const unassignedClients = clientAssignments?.filter(c => !c.assignedUserId) || [];

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

      {/* Unassigned Clients Warning */}
      {unassignedClients.length > 0 && (
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
            <div className="flex flex-wrap gap-2">
              {unassignedClients.map((client) => (
                <Badge key={client._id} variant="outline" className="border-orange-300">
                  {client.firstName} {client.lastName}
                </Badge>
              ))}
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
