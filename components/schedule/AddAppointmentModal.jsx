"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export default function AddAppointmentModal({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState("");
  const [client, setClient] = useState("");
  const [type, setType] = useState("Individual Session");
  const [duration, setDuration] = useState("50 min");
  const [details, setDetails] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const newAppointment = {
      id: Date.now(), // simple unique id
      time,
      client,
      type,
      duration,
      details,
    };
    onAdd(newAppointment);
    setOpen(false);
    // Reset form
    setTime("");
    setClient("");
    setType("Individual Session");
    setDuration("50 min");
    setDetails("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Add Appointment</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Appointment</DialogTitle>
          <DialogDescription>Fill in the details for the new appointment.</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4 py-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="client">Client Name</Label>
            <Input
              id="client"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="Enter client name"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type">Session Type</Label>
            <Select value={type} onValueChange={(val) => setType(val)}>
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
              required
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Add</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
