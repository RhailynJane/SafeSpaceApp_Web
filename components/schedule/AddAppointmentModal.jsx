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
import { Loader2 } from 'lucide-react';

export default function AddAppointmentModal({ onAdd, clients = [] }) {
  console.log("Clients in modal:", clients);
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
        <Button variant="default">Add Appointment</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Appointment</DialogTitle>
          <DialogDescription>
            Fill in the details for the new appointment.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4 py-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="client">Client</Label>
            <Select onValueChange={setClientId} value={client_id}>
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
              value={appointment_date}
              onChange={(e) => setAppointmentDate(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={appointment_time}
              onChange={(e) => setAppointmentTime(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type">Session Type</Label>
            <Select value={type} onValueChange={setType}>
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
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g., 50 min"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="details">Details</Label>
            <Input
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
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

