"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { toast } from "sonner";
import { UserPlus, Users, AlertCircle } from "lucide-react";

export function ClientAssignmentPanel({ orgId }) {
  const { user } = useUser();
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Fetch client assignments with worker details
  const clientAssignments = useQuery(
    api.clients.getClientAssignments,
    user?.id && orgId ? { clerkId: user.id, orgId } : "skip"
  );

  // Fetch unassigned clients
  const unassignedClients = useQuery(
    api.clients.getUnassignedClients,
    user?.id && orgId ? { clerkId: user.id, orgId } : "skip"
  );

  // Fetch support worker loads
  const workerLoads = useQuery(
    api.clients.getSupportWorkerLoad,
    user?.id && orgId ? { clerkId: user.id, orgId } : "skip"
  );

  // Mutations
  const assignClient = useMutation(api.clients.assignToSupportWorker);
  const bulkAssign = useMutation(api.clients.bulkAssignClients);

  const handleAssignClient = async (clientId, workerId) => {
    if (!user?.id) return;

    setIsAssigning(true);
    try {
      const result = await assignClient({
        clientId,
        clerkId: user.id,
        supportWorkerId: workerId || undefined, // Auto-assign if not specified
      });

      if (result.success) {
        toast.success(
          `Client assigned to ${result.assignedWorkerName || "support worker"}`
        );
        setSelectedClient(null);
        setSelectedWorker("");
      }
    } catch (error) {
      toast.error(`Failed to assign client: ${error.message}`);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleBulkAssign = async () => {
    if (!user?.id || !orgId) return;

    setIsAssigning(true);
    try {
      const result = await bulkAssign({
        orgId,
        clerkId: user.id,
      });

      if (result.success) {
        toast.success(result.message);
      }
    } catch (error) {
      toast.error(`Failed to bulk assign: ${error.message}`);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Support Worker Load Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Support Worker Load Distribution
          </CardTitle>
          <CardDescription>
            Current client assignments per support worker
          </CardDescription>
        </CardHeader>
        <CardContent>
          {workerLoads && workerLoads.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workerLoads.map((worker) => (
                <div
                  key={worker.clerkId}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {worker.firstName} {worker.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{worker.email}</p>
                  </div>
                  <Badge variant={worker.clientCount === 0 ? "secondary" : "default"}>
                    {worker.clientCount} {worker.clientCount === 1 ? "client" : "clients"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No support workers available</p>
          )}
        </CardContent>
      </Card>

      {/* Unassigned Clients */}
      {unassignedClients && unassignedClients.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Unassigned Clients ({unassignedClients.length})
                </CardTitle>
                <CardDescription>
                  These clients need to be assigned to a support worker
                </CardDescription>
              </div>
              <Button
                onClick={handleBulkAssign}
                disabled={isAssigning || !workerLoads || workerLoads.length === 0}
                variant="outline"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Auto-Assign All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Assign To</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unassignedClients.map((client) => (
                  <TableRow key={client._id}>
                    <TableCell>
                      {client.firstName} {client.lastName}
                    </TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.phoneNumber || "N/A"}</TableCell>
                    <TableCell>
                      <Select
                        value={
                          selectedClient === client._id ? selectedWorker : ""
                        }
                        onValueChange={(value) => {
                          setSelectedClient(client._id);
                          setSelectedWorker(value);
                        }}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select worker" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">
                            Auto-assign (balanced)
                          </SelectItem>
                          {workerLoads?.map((worker) => (
                            <SelectItem
                              key={worker.clerkId}
                              value={worker.clerkId}
                            >
                              {worker.firstName} {worker.lastName} (
                              {worker.clientCount})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleAssignClient(
                            client._id,
                            selectedClient === client._id && selectedWorker !== "auto"
                              ? selectedWorker
                              : null
                          )
                        }
                        disabled={
                          isAssigning ||
                          (selectedClient === client._id && !selectedWorker)
                        }
                      >
                        Assign
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* All Client Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>All Client Assignments</CardTitle>
          <CardDescription>
            View and manage all client-support worker assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clientAssignments && clientAssignments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Assigned Support Worker</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientAssignments.map((client) => (
                  <TableRow key={client._id}>
                    <TableCell>
                      {client.firstName} {client.lastName}
                    </TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.phoneNumber || "N/A"}</TableCell>
                    <TableCell>
                      {client.assignedWorker ? (
                        <div>
                          <p className="font-medium">
                            {client.assignedWorker.firstName}{" "}
                            {client.assignedWorker.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {client.assignedWorker.email}
                          </p>
                        </div>
                      ) : (
                        <Badge variant="secondary">Unassigned</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          client.status === "active" ? "default" : "secondary"
                        }
                      >
                        {client.status || "active"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">No clients found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
