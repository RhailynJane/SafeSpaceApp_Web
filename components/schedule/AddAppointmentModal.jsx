// 'use client' directive marks this component for client-side rendering in Next.js
'use client';

// Import necessary React hook for managing state
import { useState } from 'react';

// Import Dialog components from a UI library (likely Shadcn UI based on component names)
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
// Import Button, Input, Label, Select, and Textarea components
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

// Import icons from lucide-react library
import { Loader2, Calendar, Clock, User, FileText } from 'lucide-react';

/**
 * AddAppointmentModal Component
 *
 * A modal component for scheduling a new appointment. It handles form state,
 * submission, API call, loading, and error states.
 *
 * @param {Object} props - The component props.
 * @param {function(Object): void} props.onAdd - Callback function to be executed after
 * a successful appointment creation, receiving the new appointment data.
 * @param {Array<Object>} props.clients - An array of client objects to populate
 * the client selection dropdown. Each client object should have 'id', 'client_first_name', and 'client_last_name'.
 * @returns {JSX.Element} The Add Appointment Modal component.
 */
export default function AddAppointmentModal({ onAdd, clients = [] }) {
  // State to control the visibility of the modal (open/closed)
  const [open, setOpen] = useState(false);

  // State for appointment date, initialized to today's date in "YYYY-MM-DD" format
  const [appointment_date, setAppointmentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  // State for appointment time
  const [appointment_time, setAppointmentTime] = useState("");
  // State for the selected client's ID
  const [client_id, setClientId] = useState("");
  // State for the type of session, with a default value
  const [type, setType] = useState("Individual Session");
  // State for the duration of the appointment, with a default value
  const [duration, setDuration] = useState("50 min");
  // State for optional appointment details/notes
  const [details, setDetails] = useState("");

  // State to manage the loading status during form submission
  const [loading, setLoading] = useState(false);
  // State to store and display any error messages
  const [error, setError] = useState("");

  /**
   * Handles the form submission logic.
   * Prevents default form submission, validates required fields,
   * sends data to the API, and manages success/error states.
   * @param {Event} e - The form submission event.
   */
  const handleSubmit = async (e) => {
    // 1. Prevent the default browser form submission (which causes a page reload)
    e.preventDefault();
    // Clear any previous error messages
    setError("");

    // 2. Client-side validation: Check if required fields are filled
    if (!client_id || !appointment_time || !appointment_date) {
      setError("Please fill all required fields.");
      return; // Stop the function if validation fails
    }

    try {
      // 3. Start loading state
      setLoading(true);

      // 4. Prepare the data payload for the API
      const formData = {
        client_id,
        appointment_date,
        appointment_time,
        type,
        duration,
        details,
      };

      // 5. API Call: Send a POST request to the appointments API endpoint
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData), // Convert JavaScript object to JSON string
      });

      // 6. Handle HTTP errors (e.g., 400, 500 status codes)
      if (!res.ok) {
        // Try to parse an error message from the response body
        const err = await res.json().catch(() => ({}));
        // Throw an error with a specific message or a generic one
        throw new Error(err.error || "Failed to add appointment");
      }

      // 7. Successful API call: Parse the created appointment data
      const created = await res.json();

      // 8. Execute the 'onAdd' callback with the new data
      if (onAdd) onAdd(created);

      // 9. Reset form states for the next use
      setClientId("");
      setAppointmentTime("");
      setAppointmentDate(new Date().toISOString().split("T")[0]); // Reset date to today
      setType("Individual Session");
      setDuration("50 min");
      setDetails("");
      setOpen(false); // Close the modal
    } catch (err) {
      // 10. Handle network/API errors
      console.error("Add appointment error:", err);
      // Display the error message to the user
      setError(err.message || "Something went wrong");
    } finally {
      // 11. End loading state, regardless of success or failure
      setLoading(false);
    }
  };

  // 12. Component Render
  return (
    // Dialog component controls the modal's display
    <Dialog open={open} onOpenChange={setOpen}>
      {/* DialogTrigger wraps the button that opens the modal */}
      <DialogTrigger asChild>
        <Button variant="default" size="default" className="font-medium">
          Add Appointment
        </Button>
      </DialogTrigger>

      {/* DialogContent contains the modal's structure and form */}
      <DialogContent>
        {/* Modal Header/Title section */}
        <DialogHeader>
          <DialogTitle className="text-teal-800">New Appointment</DialogTitle>
          <DialogDescription>
            Fill in the details for the new appointment.
          </DialogDescription>
        </DialogHeader>

        {/* The main form, attached to the handleSubmit function */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Client Selection Field */}
          <div className="space-y-2">
            <Label htmlFor="client" className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Client
            </Label>
            {/* Select component for client ID, maps over the 'clients' prop */}
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

          {/* Date and Time Fields */}
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
                // Update state when the input changes
                onChange={(e) => setAppointmentDate(e.target.value)}
                required // HTML validation attribute
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
                // Update state when the input changes
                onChange={(e) => setAppointmentTime(e.target.value)}
                required // HTML validation attribute
                className="h-11"
              />
            </div>
          </div>

          {/* Session Type and Duration Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="type">Session Type</Label>
              {/* Select component for appointment type */}
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
              {/* Simple Input for duration */}
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

          {/* Details Textarea Field */}
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

          {/* Error message display */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Footer buttons (Cancel and Submit) */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            {/* DialogClose closes the modal when clicked */}
            <DialogClose asChild>
              <Button type="button" variant="outline" size="default">
                Cancel
              </Button>
            </DialogClose>
            
            {/* Submit button with loading state */}
            <Button type="submit" disabled={loading} size="default" className="bg-teal-800 hover:bg-teal-900">
              {loading ? (
                // Show spinner and "Saving..." text when loading
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                // Show "Add Appointment" text when not loading
                "Add Appointment"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}