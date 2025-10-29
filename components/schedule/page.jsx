'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import AddAppointmentModal from '@/components/schedule/AddAppointmentModal';
import ViewAvailabilityModal from '@/components/schedule/ViewAvailabilityModal';
import ViewDetailsModal from '@/components/schedule/ViewDetailsModal';

export default function SchedulePage() {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAvailabilityModalOpen, setAvailabilityModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    async function fetchAppointments() {
      try {
        const response = await fetch('/api/appointments');
        const data = await response.json();
        setAppointments(data);
      } catch (error) {
        console.error("Failed to fetch appointments:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAppointments();
  }, []);

  const [prefilledSlot, setPrefilledSlot] = useState(null);

  const handleAddAppointment = async (newAppointment) => {
    const response = await fetch('/api/appointments', { method: 'POST', body: JSON.stringify(newAppointment) });
    const addedAppointment = await response.json();
    setAppointments(prev => [...prev, addedAppointment]);
  };

  const handleSelectSlot = (slot) => {
    setPrefilledSlot(slot);
  };

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-teal-600 text-white";
      case "pending":
        return "bg-gray-400 text-white";
      default:
        return "bg-gray-400 text-white";
    }
  };

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
          {isLoading ? (
            <p className="text-center text-gray-500 py-8">Loading appointments...</p>
          ) : appointments.length > 0 ? (
            appointments
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
      {selectedAppointment && <ViewDetailsModal appointment={selectedAppointment} />}
    </div>
  );
}