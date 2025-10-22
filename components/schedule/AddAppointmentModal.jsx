'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export default function AddAppointmentModal({
  onAdd,
  clients = [],
  isOpen,
  onOpenChange,
  appointmentDetails,
  trigger,
}) {
  const getInitialState = () => ({
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '',
    client_id: '',
    type: 'Individual Session',
    duration: '50 min',
    details: '',
  });

  const [formData, setFormData] = useState(getInitialState());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (appointmentDetails) {
      setFormData(prev => ({ ...prev, ...appointmentDetails }));
    }
  }, [appointmentDetails, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.client_id || !formData.appointment_time || !formData.appointment_date) {
      setError("Please fill all required fields.");
      return;
    }

    try {
      setLoading(true);

      const submissionData = {
        ...formData,
        client_id: parseInt(formData.client_id, 10),
      };

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to add appointment");
      }

      const created = await res.json();

      if (onAdd) onAdd(created);

      setFormData(getInitialState());
      onOpenChange(false);
    } catch (err) {
      console.error("Add appointment error:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Appointment</DialogTitle>
          <DialogDescription>
            Fill in the details for the new appointment.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4 py-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="client">Client</Label>
            <Select onValueChange={(value) => handleValueChange('client_id', value)} value={formData.client_id}>
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.client_first_name} {client.client_last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.appointment_date}
              onChange={(e) => handleValueChange('appointment_date', e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={formData.appointment_time}
              onChange={(e) => handleValueChange('appointment_time', e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type">Session Type</Label>
            <Select value={formData.type} onValueChange={(value) => handleValueChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select session type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Individual Session">
                  Individual Session
                </SelectItem>
                <SelectItem value="Group Therapy">Group Therapy</SelectItem>
                <SelectItem value="Assessment">Assessment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="duration">Duration</Label>
            <Input
              id="duration"
              value={formData.duration}
              onChange={(e) => handleValueChange('duration', e.target.value)}
              placeholder="e.g., 50 min"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="details">Details</Label>
            <Input
              id="details"
              value={formData.details}
              onChange={(e) => handleValueChange('details', e.target.value)}
              placeholder="Appointment details"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex justify-end gap-2 mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                "Add"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
