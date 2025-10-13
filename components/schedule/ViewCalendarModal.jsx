"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@clerk/nextjs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar"
import moment from "moment"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { Calendar } from "lucide-react"

const localizer = momentLocalizer(moment)

export default function ViewCalendarModal({ isOpen, onOpenChange }) {
  const [events, setEvents] = useState([])
  const { isLoaded, isSignedIn } = useAuth()
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState('week');

  useEffect(() => {
    // Only fetch data if the modal is open AND the user is signed in.
    if (isOpen && isLoaded && isSignedIn) {
      const fetchSchedule = async () => {
        try {
          const response = await fetch("/api/schedule")
          if (!response.ok) {
            throw new Error("Failed to fetch schedule")
          }
          const sessions = await response.json()
          const formattedEvents = sessions.map(session => ({
            id: session.id,
            title: session.title || `${session.sessionType.type_name} with ${session.patient.first_name}`,
            start: new Date(session.start_time),
            end: new Date(session.end_time),
            resource: session,
          }))
          setEvents(formattedEvents)
        } catch (error) {
          console.error("Error fetching schedule:", error)
          // Handle error display to the user
        }
      }

      fetchSchedule()
    }
  }, [isOpen, isLoaded, isSignedIn])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Calendar className="h-4 w-4 mr-2" />
          View Calendar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>My Calendar</DialogTitle>
        </DialogHeader>
        <div className="h-[calc(80vh-100px)]">
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
            defaultDate={new Date()}
            date={date}
            view={view}
            onNavigate={(newDate) => setDate(newDate)}
            onView={(newView) => setView(newView)}
            views={["month", "week", "day"]}
            selectable
            // onSelectSlot={(slotInfo) => console.log("Selected slot:", slotInfo)}
            // onSelectEvent={(event) => console.log("Selected event:", event)}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}