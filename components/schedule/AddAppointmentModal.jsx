'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { PlusCircle } from 'lucide-react';

export default function AddAppointmentModal({ isOpen, onOpenChange, onAdd, clients = [], prefilledSlot, onClose }) {
  const [formData, setFormData] = useState({
    clientId: '',
    date: '',
    time: '',
    type: 'Individual Session',
    duration: '50',
    details: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (prefilledSlot) {
      setFormData(prev => ({
        ...prev,
        date: prefilledSlot.date,
        time: prefilledSlot.time,
      }));
    }
  }, [prefilledSlot]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const appointmentTime = `${formData.date}T${formData.time}:00`;

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: parseInt(formData.clientId),
          appointment_time: appointmentTime,
          type: formData.type,
          duration: formData.duration,
          details: formData.details,
          status: 'scheduled'
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to add appointment");
      }

      const newAppointment = await res.json();
      onAdd(newAppointment);
      onOpenChange(false); // Close modal on success
      if (onClose) onClose(); // Reset prefilled slot
    } catch (err) {
      console.error("Add appointment error:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleModalOpenChange = (open) => {
    onOpenChange(open);
    if (!open && onClose) {
      onClose(); // Reset prefilled slot when modal is closed
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default"><PlusCircle className="h-4 w-4 mr-2" />Add Appointment</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Appointment</DialogTitle>
          <DialogDescription>Fill in the details for the new appointment.</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4 py-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="client">Client</Label>
            <Select name="clientId" value={formData.clientId} onValueChange={(value) => handleSelectChange('clientId', value)}>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time">Time</Label>
              <Input id="time" name="time" type="time" value={formData.time} onChange={handleChange} required />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type">Session Type</Label>
            <Select name="type" value={formData.type} onValueChange={(value) => handleSelectChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select session type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Individual Session">Individual Session</SelectItem>
                <SelectItem value="Group Therapy">Group Therapy</SelectItem>
                <SelectItem value="Assessment">Assessment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="duration">Duration</Label>
            <Select name="duration" value={formData.duration} onValueChange={(value) => handleSelectChange('duration', value)}>
              <SelectTrigger><SelectValue placeholder="Select duration" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="50">50 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="details">Details</Label>
            <Input id="details" name="details" value={formData.details} onChange={handleChange} placeholder="e.g., Follow-up session" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700">
              {loading ? 'Adding...' : 'Add Appointment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
