"use client"; 
// This directive tells Next.js that this file runs on the client side (browser) 
// and can use hooks like useState or event handlers.

import { useState, useEffect } from "react";
// React hook for managing state variables in a functional component.

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
// Importing reusable dialog (modal) components from your UI library (shadcn/ui).
// These handle opening, closing, and content of the modal.

import { Button } from "@/components/ui/button"; // Button component (styled)
import { Input } from "@/components/ui/input"; // Input component for text fields
import { Label } from "@/components/ui/label"; // Label for form fields
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from "@/components/ui/select"; 
import { Plus } from "lucide-react";
// Dropdown (Select) components for choosing options.


// Main component definition
export default function AddAppointmentModal({ onAdd, prefilledSlot, onClose }) {
  // Props:
  // - onAdd: a function passed from the parent component that handles adding a new appointment.

  // State variables to manage form input values and dialog visibility.
  const [isOpen, setIsOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    clientName: "",
    date: "",
    time: "",
    duration: "50 min",
  });

  useEffect(() => {
    if (prefilledSlot) {
      setNewAppointment(prev => ({
        ...prev,
        date: prefilledSlot.date,
        time: prefilledSlot.time,
      }));
      setIsOpen(true);
    }
  }, [prefilledSlot]);

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (!open && onClose) {
      onClose();
    }
  };

  // Function to handle form submission
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevents the default browser reload behavior on form submission

    // Call the parent function to add the new appointment to the list
    onAdd(newAppointment);

    // Close the modal after submission
    // Close the modal after submission
    handleOpenChange(false);

    // Reset form fields back to their initial values
    setNewAppointment({ client: "", date: "", time: "", duration: "50 min" });
  };

  return (
    // Dialog (modal) wrapper
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {/* Button that opens the modal */}
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Appointment
        </Button>
      </DialogTrigger>

      {/* Modal content area */}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Appointment</DialogTitle>
          <DialogDescription>
            Fill in the details for the new appointment.
          </DialogDescription>
        </DialogHeader>

        {/* Appointment form */}
        <form className="grid gap-4 py-4" onSubmit={handleSubmit}>
          
          {/* Client name input field */}
          <div className="grid gap-2">
            <Label htmlFor="clientName">Client Name</Label>
            <Input
              id="clientName"
              value={newAppointment.clientName}
              onChange={(e) => setNewAppointment({ ...newAppointment, clientName: e.target.value })}
              placeholder="Enter client name"
              required
            />
          </div>

          {/* Time input field */}
          <div className="grid gap-2">
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={newAppointment.time}
              onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
              required
            />
          </div>

          {/* Dropdown to select session type */}
          <div className="grid gap-2">
            <Label htmlFor="type">Session Type</Label>
            <Select value={newAppointment.type} onValueChange={(val) => setNewAppointment({ ...newAppointment, type: val })}>
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

          {/* Duration input field */}
          <div className="grid gap-2">
            <Label htmlFor="duration">Duration</Label>
            <Input
              id="duration"
              value={newAppointment.duration}
              onChange={(e) => setNewAppointment({ ...newAppointment, duration: e.target.value })}
              placeholder="e.g., 50 min"
              required
            />
          </div>

          {/* Details input field */}
          <div className="grid gap-2">
            <Label htmlFor="details">Details</Label>
            <Input
              id="details"
              value={newAppointment.details}
              onChange={(e) => setNewAppointment({ ...newAppointment, details: e.target.value })}
              placeholder="Appointment details"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex justify-end gap-2 mt-4">
            {/* Cancel button that closes the dialog without submitting */}
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
