'use client';

// Import necessary React hook for managing state
import { useState, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import TimePickerDialog from './TimePickerDialog';

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
import { useToast } from '@/contexts/ToastContext';

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
 * @returns {JSX.Element} The Add Appointment Modal component.
 */
export default function AddAppointmentModal({ onAdd, defaultDate, clients: clientsProp, existingAppointments }) {
  const { user, isLoaded } = useUser();
  const clients = useQuery(
    api.clients.list,
    isLoaded && user?.id ? { clerkId: user.id } : 'skip'
  ) || [];
  const clientOptions = clientsProp && Array.isArray(clientsProp) ? clientsProp : clients;
  
  // State for appointment date, initialized to today's date in "YYYY-MM-DD" format
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [appointment_date, setAppointmentDate] = useState(defaultDate || todayStr);
  
  // Fetch appointments for the SELECTED date to check for conflicts
  const listForDate = useQuery(
    api.appointments.listByDate,
    isLoaded && user?.id && appointment_date ? { clerkId: user.id, date: appointment_date } : 'skip'
  );
  
  // Fetch user's availability settings
  const currentUser = useQuery(
    api.users.getByClerkId,
    isLoaded && user?.id ? { clerkId: user.id } : 'skip'
  );
  
  const createAppt = useMutation(api.appointments.create);
  const toast = useToast();

  // State to control the visibility of the modal (open/closed)
  const [open, setOpen] = useState(false);
  // State for time picker dialog visibility
  const [timePickerOpen, setTimePickerOpen] = useState(false);
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Check if selected time is within user's availability settings
   */
  const isTimeAvailable = useMemo(() => {
    if (!appointment_date || !appointment_time || !currentUser?.availability) {
      return true; // If no availability set, allow all times
    }

    const selectedDate = new Date(appointment_date);
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    const dayAvailability = currentUser.availability.find(
      slot => slot.day.toLowerCase() === dayOfWeek
    );

    if (!dayAvailability || !dayAvailability.enabled) {
      return false; // Day is disabled
    }

    // Check if time is within available range
    const [selectedHour, selectedMinute] = appointment_time.split(':').map(Number);
    const [startHour, startMinute] = dayAvailability.startTime.split(':').map(Number);
    const [endHour, endMinute] = dayAvailability.endTime.split(':').map(Number);

    const selectedMinutes = selectedHour * 60 + selectedMinute;
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    return selectedMinutes >= startMinutes && selectedMinutes < endMinutes;
  }, [appointment_date, appointment_time, currentUser?.availability]);

  /**
   * Get availability message for selected date/time
   */
  const availabilityMessage = useMemo(() => {
    if (!appointment_date || !currentUser?.availability) {
      return null;
    }

    const selectedDate = new Date(appointment_date);
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    const dayAvailability = currentUser.availability.find(
      slot => slot.day.toLowerCase() === dayOfWeek
    );

    if (!dayAvailability || !dayAvailability.enabled) {
      return `You are not available on ${selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}s. Update your availability in your profile settings.`;
    }

    if (appointment_time && !isTimeAvailable) {
      return `Selected time is outside your available hours (${dayAvailability.startTime} - ${dayAvailability.endTime}). Please choose a time within your availability.`;
    }

    return null;
  }, [appointment_date, appointment_time, currentUser?.availability, isTimeAvailable]);

  /**
   * Handles the form submission logic.
   * Prevents default form submission, validates required fields,
   * sends data to the API, and manages success/error states.
   * @param {Event} e - The form submission event.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!client_id || !appointment_time || !appointment_date) {
      setError("Please fill all required fields.");
      return; // Stop the function if validation fails
    }

    // Check availability
    if (!isTimeAvailable) {
      setError(availabilityMessage || "Selected time is outside your available hours.");
      return;
    }

    const selectedDateTime = new Date(`${appointment_date}T${appointment_time}`);
    const now = new Date();

    if (selectedDateTime < now) {
        setError("Cannot schedule an appointment in the past. Please select a future date or time.");
        return;
    }

    const durationInMinutes = parseInt(duration.split(" ")[0], 10);
    if (isNaN(durationInMinutes)) {
        setError("Invalid duration format. Please use a format like '50 min'.");
        return;
    }
    const newAppointmentEnd = new Date(selectedDateTime.getTime() + durationInMinutes * 60000);

    const hasConflict = (listForDate || []).some(existingAppt => {
      if (!existingAppt.appointmentDate || !existingAppt.appointmentTime || !existingAppt.duration) {
            return false;
        }

        // Create a Date object for the existing appointment's time of day
      const [hours, minutes] = String(existingAppt.appointmentTime).split(":").map(Number);
      const seconds = 0;

        // Create a Date object for the existing appointment's date part
        const dateObj = new Date(existingAppt.appointmentDate);
        const year = dateObj.getUTCFullYear();
        const month = dateObj.getUTCMonth();
        const day = dateObj.getUTCDate();

        // Combine them to create a new Date object in the local timezone
        const existingStart = new Date(year, month, day, hours, minutes, seconds);

        const existingDuration = parseInt(existingAppt.duration, 10);
        if (isNaN(existingDuration)) {
            return false;
        }
        const existingEnd = new Date(existingStart.getTime() + existingDuration * 60000);

        // Check for overlap: (StartA < EndB) and (EndA > StartB)
        return selectedDateTime < existingEnd && newAppointmentEnd > existingStart;
    });

    if (hasConflict) {
      setError("You already have an overlapping appointment at this time.");
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

      // 5. API Call: Send a POST request to the appointments API endpoint
      // Create via Convex
      const selectedClient = clientOptions.find((c) => String(c._id || c.id) === String(client_id));
      const createdId = await createAppt({
        clerkId: user.id,
        appointmentDate: appointment_date,
        appointmentTime: appointment_time,
        type,
        duration: durationInMinutes,
        notes: details,
        clientDbId: client_id ? client_id : undefined,
        clientClerkId: selectedClient?.clerkId, // Pass clerk ID for proper userId resolution
      });

      // 8. Execute the 'onAdd' callback with enriched client name for optimistic UI
      let first = '';
      let last = '';
      const found = clientOptions.find((c) => String(c._id || c.id) === String(client_id));
      if (found) {
        first = found.firstName || found.client_first_name || '';
        last = found.lastName || found.client_last_name || '';
      }
      if (onAdd) onAdd({
        _id: createdId,
        clientId: client_id,
        appointmentDate: appointment_date,
        appointmentTime: appointment_time,
        type,
        duration: `${durationInMinutes} min`,
        details,
        client: { client_first_name: first, client_last_name: last },
      });

      // Show success toast
      toast.success('Appointment added successfully');

      // 9. Reset form states for the next use
      setClientId("");
      setAppointmentTime("");
      const resetDate = new Date();
      setAppointmentDate(`${resetDate.getFullYear()}-${String(resetDate.getMonth() + 1).padStart(2, '0')}-${String(resetDate.getDate()).padStart(2, '0')}`);
      setType("Individual Session");
      setDuration("50 min");
      setDetails("");
      setOpen(false); // Close the modal
    } catch (err) {
      console.error('Add appointment error:', err);
      setError(err.message || 'Something went wrong');
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

      {/* DialogContent contains the modal's structure and form */}
      <DialogContent className="max-w-2xl">
        {/* Modal Header/Title section */}
        <DialogHeader className="space-y-3 pb-4">
          <DialogTitle className="text-2xl font-semibold text-teal-800 dark:text-teal-400">New Appointment</DialogTitle>
          <DialogDescription className="text-base text-gray-600 dark:text-gray-400">
            Fill in the details for the new appointment.
          </DialogDescription>
        </DialogHeader>

        {/* The main form, attached to the handleSubmit function */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Client Selection Field */}
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
                {clientOptions.map((client) => (
                  <SelectItem key={client._id || client.id} value={client._id || client.id}>
                    {(client.firstName || client.client_first_name) || ''} {(client.lastName || client.client_last_name) || ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Date
              </Label>
              <Input
                type="date"
                id="date"
                value={appointment_date}
                min={todayStr}
                // Update state when the input changes
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
              <Button
                type="button"
                onClick={() => setTimePickerOpen(true)}
                variant="outline"
                className="w-full h-11 justify-start text-left font-normal"
              >
                {appointment_time || 'Select time'}
              </Button>
            </div>
          </div>

          {/* Session Type and Duration Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <SelectItem value="Group Therapy">
                    Group Therapy
                  </SelectItem>
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

          {/* --- Details --- */}
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

          {/* Availability warning */}
          {availabilityMessage && (
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3">
              <p className="text-yellow-700 dark:text-yellow-400 text-sm font-medium">{availabilityMessage}</p>
            </div>
          )}

          {/* Error message display */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-teal-800 hover:bg-teal-900"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Add Appointment'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Time Picker Dialog */}
      <TimePickerDialog
        open={timePickerOpen}
        onOpenChange={setTimePickerOpen}
        value={appointment_time}
        onSelect={setAppointmentTime}
      />
    </Dialog>
  );
}
