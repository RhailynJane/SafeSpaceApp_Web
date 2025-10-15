"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Loader2 } from "lucide-react";

export default function AddAppointmentModal({ onAdd }) {
  const [formData, setFormData] = useState({
    client_id: "",
    appointment_date: "",
    appointment_time: "",
    type: "",
    duration: "",
    details: "",
  });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.client_id || !formData.appointment_date || !formData.appointment_time) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to add appointment");

      const created = await res.json();
      onAdd(created);
      setFormData({
        client_id: "",
        appointment_date: "",
        appointment_time: "",
        type: "",
        duration: "",
        details: "",
      });
      setOpen(false);
    } catch (err) {
      console.error(err);
      alert("Error creating appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#c6e3dc] text-gray-900 hover:bg-[#b7d9d1] rounded-xl shadow-sm">
          <PlusCircle className="h-4 w-4 mr-2" /> Add Appointment
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-[#e7f3f0] rounded-2xl shadow-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-800">
            New Appointment
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid gap-2">
            <Label htmlFor="client_id">Client ID</Label>
            <Input
              id="client_id"
              name="client_id"
              value={formData.client_id}
              onChange={handleChange}
              placeholder="Enter client ID"
              required
              className="rounded-lg border-gray-300"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="appointment_date">Date</Label>
            <Input
              type="date"
              id="appointment_date"
              name="appointment_date"
              value={formData.appointment_date}
              onChange={handleChange}
              required
              className="rounded-lg border-gray-300"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="appointment_time">Time</Label>
            <Input
              type="time"
              id="appointment_time"
              name="appointment_time"
              value={formData.appointment_time}
              onChange={handleChange}
              required
              className="rounded-lg border-gray-300"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type">Session Type</Label>
            <Input
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              placeholder="E.g., Consultation"
              className="rounded-lg border-gray-300"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="duration">Duration</Label>
            <Input
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              placeholder="E.g., 45 min"
              className="rounded-lg border-gray-300"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="details">Details</Label>
            <Input
              id="details"
              name="details"
              value={formData.details}
              onChange={handleChange}
              placeholder="Optional notes..."
              className="rounded-lg border-gray-300"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4aa59c] hover:bg-[#3e958c] text-white rounded-xl"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              "Save Appointment"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
