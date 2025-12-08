'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import AddAppointmentModal from '@/components/schedule/AddAppointmentModal';
import ViewAvailabilityModal from '@/components/schedule/ViewAvailabilityModal';
import ViewDetailsModal from '@/components/schedule/ViewDetailsModal';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function SchedulePage() {
  const { user, isLoaded } = useUser();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Fetch ALL appointments (not just today) to show full schedule
  const convexAppointments = useQuery(
    api.appointments.list,
    isLoaded && user?.id ? { clerkId: user.id } : 'skip'
  ) || [];
  
  const [isAvailabilityModalOpen, setAvailabilityModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [prefilledSlot, setPrefilledSlot] = useState(null);

  const handleAddAppointment = async (_newAppointment) => {
    // Trigger refetch by changing key
    setRefreshTrigger(t => t + 1);
  };

  const handleSelectSlot = (slot) => {
    setPrefilledSlot(slot);
  };

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
  };

  const handleDetailsClose = useCallback(() => {
    setSelectedAppointment(null);
    // Trigger refetch when closing details (after cancel/reschedule)
    setRefreshTrigger(t => t + 1);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-teal-600 text-white";
      case "pending":
        return "bg-gray-400 text-white";
      case "cancelled":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-400 text-white";
    }
  };

  // Filter out cancelled appointments and include full data for details modal
  const mapped = (convexAppointments || [])
    .filter(a => a.status !== 'cancelled')
    .map(a => ({
      _id: a._id,
      id: a._id,
      clientName: a.clientName || '',
      type: a.type || '',
      date: a.appointmentDate,
      time: a.appointmentTime || '',
      status: a.status || 'scheduled',
      // Include full appointment data for the modal
      appointmentDate: a.appointmentDate,
      appointmentTime: a.appointmentTime,
      duration: a.duration,
      details: a.notes,
      client: a.client,
    }))
    .sort((a, b) => {
      const dateA = new Date(a.date + ' ' + a.time);
      const dateB = new Date(b.date + ' ' + b.time);
      return dateA - dateB;
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Schedule</h1>
        <div className="flex gap-2">
          <ViewAvailabilityModal 
            onSelect={handleSelectSlot} 
            isOpen={isAvailabilityModalOpen} 
            onOpenChange={setAvailabilityModalOpen} 
          />
          <AddAppointmentModal onAdd={handleAddAppointment} prefilledSlot={prefilledSlot} onClose={() => setPrefilledSlot(null)} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mapped.length > 0 ? (
            mapped
              .sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time))
              .map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <CalendarIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{appointment.clientName}</p>
                      <p className="text-sm text-gray-600">{appointment.type}</p>
                      <p className="text-xs text-gray-500">{new Date(appointment.date).toDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">{appointment.time}</span>
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status}
                    </Badge>
                    <Button variant="outline" onClick={() => handleViewDetails(appointment)}>View Details</Button>
                  </div>
                </div>
              ))
          ) : (
            <p className="text-center text-gray-500 py-8">No upcoming appointments.</p>
          )}
        </CardContent>
      </Card>
      {selectedAppointment && <ViewDetailsModal appointment={selectedAppointment} onClose={handleDetailsClose} />}
    </div>
  );
}