"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import moment from "moment";
import { Calendar as BigCalendar } from "react-big-calendar";
import { localizer } from "./localizer";
import "react-big-calendar/lib/css/react-big-calendar.css";

export default function ViewCalendarModal({ schedule = [], isOpen, onOpenChange }) {
  const events = schedule.map(appt => {
    // Ensure the appointment and its client data exist before creating an event
    if (!appt || !appt.client || !appt.appointment_date) {
      return null;
    }
    // Combine date and time from your data into a single Date object for the event start
    // Using moment.js for more robust parsing.
    const startMoment = moment(appt.appointment_time);
   
    // If the start date is invalid, skip this event to prevent calendar crash
    if (!startMoment.isValid()) {
      console.warn("Invalid start date for appointment:", appt);
      return null;
    }

    // Calculate end time based on duration
    const parsedDuration = appt.duration ? parseInt(String(appt.duration).split(' ')[0], 10) : 60;
    const durationMinutes = !isNaN(parsedDuration) ? parsedDuration : 60;
    const start = startMoment.toDate();
    const end = startMoment.clone().add(durationMinutes, 'minutes').toDate();

    return {
      id: appt.id,
      title: `${appt.client.client_first_name} ${appt.client.client_last_name} - ${appt.type}`,
      start,
      end,
      allDay: false,
      resource: appt,
    };
  });
  const validEvents = events.filter(Boolean);
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}> 
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Full Schedule</DialogTitle>
        </DialogHeader>
        <div className="h-[calc(80vh-100px)]">
          <BigCalendar
            localizer={localizer}
            events={validEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            views={['month', 'week', 'day']}
            defaultView="month"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}