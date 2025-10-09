"use client"; 
// This directive tells Next.js that this file runs on the client side (browser) 
// and can use hooks like useState or event handlers.

import { useState } from "react";
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
// Dropdown (Select) components for choosing options.


// Main component definition
export default function AddAppointmentModal({ onAdd }) {
  // Props:
  // - onAdd: a function passed from the parent component that handles adding a new appointment.

  // State variables to manage form input values and dialog visibility.
  const [open, setOpen] = useState(false);            // Controls whether the modal is open
  const [time, setTime] = useState("");               // Stores appointment time
  const [client, setClient] = useState("");           // Stores client name
  const [type, setType] = useState("Individual Session"); // Stores session type
  const [duration, setDuration] = useState("50 min"); // Stores session duration
  const [details, setDetails] = useState("");         // Stores appointment details

  // Function to handle form submission
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevents the default browser reload behavior on form submission

    // Create a new appointment object with form data
    const newAppointment = {
      id: Date.now(), // Simple unique ID based on the current timestamp
      time,
      client,
      type,
      duration,
      details,
    };

    // Call the parent function to add the new appointment to the list
    onAdd(newAppointment);

    // Close the modal after submission
    setOpen(false);

    // Reset form fields back to their initial values
    setTime("");
    setClient("");
    setType("Individual Session");
    setDuration("50 min");
    setDetails("");
  };

  return (
    // Dialog (modal) wrapper
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Button that opens the modal */}
      <DialogTrigger asChild>
        <Button variant="default">Add Appointment</Button>
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
            <Label htmlFor="client">Client Name</Label>
            <Input
              id="client"
              value={client}
              onChange={(e) => setClient(e.target.value)}
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
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>

          {/* Dropdown to select session type */}
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

          {/* Duration input field */}
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

          {/* Details input field */}
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

          {/* Form action buttons */}
          <div className="flex justify-end gap-2 mt-4">
            {/* Cancel button that closes the dialog without submitting */}
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            
            {/* Submit button that triggers handleSubmit */}
            <Button type="submit">Add</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
