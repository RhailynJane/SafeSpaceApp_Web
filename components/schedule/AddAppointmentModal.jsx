'use client';

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Calendar, Clock, User, FileText } from 'lucide-react';

export default function AddAppointmentModal({ onAdd, clients = [] }) {
  const [open, setOpen] = useState(false);
  const [appointment_date, setAppointmentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [appointment_time, setAppointmentTime] = useState("");
  const [client_id, setClientId] = useState("");
  const [type, setType] = useState("Individual Session");
  const [duration, setDuration] = useState("50 min");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!client_id || !appointment_time || !appointment_date) {
      setError("Please fill all required fields.");
      return;
    }

    try {
      setLoading(true);

      const formData = {
        client_id,
        appointment_date,
        appointment_time,
        type,
        duration,
        details,
      };

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to add appointment");
      }

      const created = await res.json();

      if (onAdd) onAdd(created);

      setClientId("");
      setAppointmentTime("");
      setAppointmentDate(new Date().toISOString().split("T")[0]);
      setType("Individual Session");
      setDuration("50 min");
      setDetails("");
      setOpen(false);
    } catch (err) {
      console.error("Add appointment error:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="default" className="font-medium">
          Add Appointment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-teal-800">New Appointment</DialogTitle>
          <DialogDescription>
            Fill in the details for the new appointment.
          </DialogDescription>
        </DialogHeader>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Client - Full width first row */}
          <div className="space-y-2">
            <Label htmlFor="client" className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Client
            </Label>
            <Select onValueChange={setClientId} value={client_id}>
              <SelectTrigger id="client" className="h-11">
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

          {/* Date and Time - Second row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={appointment_date}
                onChange={(e) => setAppointmentDate(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Time
              </Label>
              <Input
                id="time"
                type="time"
                value={appointment_time}
                onChange={(e) => setAppointmentTime(e.target.value)}
                required
                className="h-11"
              />
            </div>
          </div>

          {/* Session Type and Duration - Third row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="type">Session Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type" className="h-11">
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

            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g., 50 min"
                required
                className="h-11"
              />
            </div>
          </div>

          {/* Details - Fourth row, full width textarea */}
          <div className="space-y-2">
            <Label htmlFor="details" className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Details
            </Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Appointment details (optional)"
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="default">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading} size="default" className="bg-teal-800 hover:bg-teal-900">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Add Appointment"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}