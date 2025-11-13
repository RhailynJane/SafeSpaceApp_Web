/* Comments added with claude.ai
 * Prompts : add proper comments and documentation
 * Enhanced with visual date and time pickers
 */

/* Add Appointment Modal Component
 * 
 * This is a React component that displays a modal (popup) for creating new appointments.
 * It's a form with multiple fields that allows users to:
 * - Select a client
 * - Choose date and time (with enhanced visual pickers)
 * - Set session type and duration
 * - Add optional notes 
 */

'use client';

import { useState, useEffect, useMemo } from 'react';

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

import { Loader2, Calendar, Clock, User, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * AddAppointmentModal Component
 *
 * A modal component for scheduling a new appointment with enhanced date and time pickers.
 */
export default function AddAppointmentModal({ onAdd, clients = [], existingAppointments = [] }) {
  const [open, setOpen] = useState(false);

  const todayDateString = new Date().toLocaleDateString('en-CA');

  const [appointment_date, setAppointmentDate] = useState(todayDateString);
  const [appointment_time, setAppointmentTime] = useState("");
  const [client_id, setClientId] = useState("");
  const [type, setType] = useState("Individual Session");
  const [duration, setDuration] = useState("50 min");
  const [details, setDetails] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Enhanced picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Availability state
  const [availability, setAvailability] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState(null);

  useEffect(() => {
    if (open) {
      const fetchAvailability = async () => {
        setAvailabilityLoading(true);
        setAvailabilityError(null);
        try {
          const response = await fetch('/api/user/availability');
          if (!response.ok) {
            throw new Error('Failed to fetch availability');
          }
          const data = await response.json();
          setAvailability(data);
        } catch (err) {
          setAvailabilityError(err.message);
        } finally {
          setAvailabilityLoading(false);
        }
      };
      fetchAvailability();
    }
  }, [open]);

  const availableTimeSlots = useMemo(() => {
    if (!appointment_date || availability.length === 0) return [];

    const selectedDate = new Date(appointment_date + 'T00:00:00');
    const dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][selectedDate.getDay()];
    const dayAvailability = availability.find(a => a.day_of_week === dayOfWeek);

    if (!dayAvailability) return [];

    const [startHour] = dayAvailability.start_time.split(':').map(Number);
    const [endHour] = dayAvailability.end_time.split(':').map(Number);

    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const hourStr = hour > 12 ? hour - 12 : hour;
        const period = hour >= 12 ? 'PM' : 'AM';
        const minuteStr = minute.toString().padStart(2, '0');
        const displayTime = `${hourStr}:${minuteStr} ${period}`;
        const valueTime = `${hour.toString().padStart(2, '0')}:${minuteStr}`;
        slots.push({ display: displayTime, value: valueTime });
      }
    }
    return slots;
  }, [appointment_date, availability]);

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
  
  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateSelect = (day) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateString = selectedDate.toLocaleDateString('en-CA');
    setAppointmentDate(dateString);
    setAppointmentTime(""); // Reset time when date changes
    setShowDatePicker(false);
  };

  const handleTimeSelect = (time) => {
    setAppointmentTime(time);
    setShowTimePicker(false);
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDisplayTime = (timeString) => {
    if (!timeString) return '';
    const [hour, minute] = timeString.split(':');
    const hourNum = parseInt(hour);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum > 12 ? hourNum - 12 : (hourNum === 0 ? 12 : hourNum);
    return `${displayHour}:${minute} ${period}`;
  };

  const isDateDisabled = (day) => {
    if (!day) return true;
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkDate < today) return true;

    if (availability.length > 0) {
      const dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][checkDate.getDay()];
      return !availability.some(a => a.day_of_week === dayOfWeek);
    }
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!client_id || !appointment_time || !appointment_date) {
      setError("Please fill all required fields.");
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

    const hasConflict = (existingAppointments || []).some(existingAppt => {
        if (!existingAppt.appointment_date || !existingAppt.appointment_time || !existingAppt.duration) {
            return false;
        }

        const dateStr = `${existingAppt.appointment_date.substring(0, 10)}T${existingAppt.appointment_time.substring(11, 23)}`;
        const existingStart = new Date(dateStr);

        const existingDuration = parseInt(existingAppt.duration.split(" ")[0], 10);
        if (isNaN(existingDuration)) {
            return false;
        }
        const existingEnd = new Date(existingStart.getTime() + existingDuration * 60000);

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

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-teal-800">New Appointment</DialogTitle>
          <DialogDescription>
            Fill in the details for the new appointment.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6" onSubmit={handleSubmit}>
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
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.client_first_name} {client.client_last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Enhanced Date and Time Pickers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date Picker */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Date
              </Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="w-full h-11 px-3 py-2 text-left border rounded-md bg-white hover:bg-gray-50 flex items-center justify-between"
                >
                  <span className={appointment_date ? "text-gray-900" : "text-gray-500"}>
                    {appointment_date ? formatDisplayDate(appointment_date) : "Select date"}
                  </span>
                  <Calendar className="h-4 w-4 text-gray-400" />
                </button>

                {showDatePicker && (
                  <div className="absolute z-50 mt-2 bg-white border rounded-lg shadow-lg p-4 w-80">
                    {availabilityLoading ? (
                      <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : availabilityError ? (
                      <p className="text-red-500 text-sm">{availabilityError}</p>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <span className="font-semibold text-sm">
                            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                          </span>
                          <button
                            type="button"
                            onClick={handleNextMonth}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                            <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                              {day}
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                          {days.map((day, index) => {
                            const isSelected = day && appointment_date === 
                              `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const disabled = isDateDisabled(day);
                            
                            return (
                              <button
                                key={index}
                                type="button"
                                onClick={() => !disabled && handleDateSelect(day)}
                                disabled={disabled}
                                className={`
                                  aspect-square rounded text-sm transition
                                  ${!day ? 'invisible' : ''}
                                  ${disabled ? 'text-gray-300 cursor-not-allowed' : ''}
                                  ${isSelected
                                    ? 'bg-teal-600 text-white font-semibold'
                                    : !disabled ? 'hover:bg-teal-50 text-gray-700' : ''
                                  }
                                `}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Time Picker */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Time
              </Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTimePicker(!showTimePicker)}
                  disabled={!appointment_date || availableTimeSlots.length === 0}
                  className="w-full h-11 px-3 py-2 text-left border rounded-md bg-white hover:bg-gray-50 flex items-center justify-between disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <span className={appointment_time ? "text-gray-900" : "text-gray-500"}>
                    {appointment_time ? formatDisplayTime(appointment_time) : "Select time"}
                  </span>
                  <Clock className="h-4 w-4 text-gray-400" />
                </button>

                {showTimePicker && (
                  <div className="absolute z-50 mt-2 bg-white border rounded-lg shadow-lg w-full max-h-64 overflow-y-auto">
                    {availableTimeSlots.length > 0 ? (
                      <div className="grid grid-cols-3 gap-1 p-2">
                        {availableTimeSlots.map((slot) => (
                          <button
                            key={slot.value}
                            type="button"
                            onClick={() => handleTimeSelect(slot.value)}
                            className={`
                              py-2 px-3 rounded text-sm transition
                              ${appointment_time === slot.value
                                ? 'bg-teal-600 text-white font-semibold'
                                : 'hover:bg-teal-50 text-gray-700'
                              }
                            `}
                          >
                            {slot.display}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-sm text-gray-500 p-4">No available slots for this day.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Session Type and Duration Fields */}
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
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger id="duration" className="h-11">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30 min">30 minutes</SelectItem>
                  <SelectItem value="50 min">50 minutes</SelectItem>
                  <SelectItem value="90 min">1 hour 30 minutes</SelectItem>
                  <SelectItem value="120 min">2 hours</SelectItem>
                </SelectContent>
              </Select>
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