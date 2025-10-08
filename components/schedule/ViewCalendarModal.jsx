"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"

export default function ViewCalendarModal({ schedule = [] }) {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth()) // current month (0–11)
  const [year, setYear] = useState(today.getFullYear())
  const [selectedDay, setSelectedDay] = useState(null) // clicked day

  // Extract appointment dates (assumes appointments have `date` field "YYYY-MM-DD")
  const appointmentDates = schedule.map((appt) => appt?.date).filter(Boolean)

  // Generate days for the current month
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()

  const days = []
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)

  const formatDate = (day) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
      2,
      "0"
    )}`

  const isAppointmentDay = (day) => {
    if (!day) return false
    return appointmentDates.includes(formatDate(day))
  }

  const getAppointmentsForDay = (day) => {
    if (!day) return []
    return schedule.filter((appt) => appt?.date === formatDate(day))
  }

  const getAppointmentCount = (day) => getAppointmentsForDay(day).length

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  // Navigation
  const goToPrevMonth = () => {
    if (month === 0) {
      setMonth(11)
      setYear(year - 1)
    } else {
      setMonth(month - 1)
    }
    setSelectedDay(null) // reset selection
  }

  const goToNextMonth = () => {
    if (month === 11) {
      setMonth(0)
      setYear(year + 1)
    } else {
      setMonth(month + 1)
    }
    setSelectedDay(null) // reset selection
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Calendar className="h-4 w-4 mr-2" /> View Calendar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader className="flex flex-row items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevMonth}
            className="rounded-full"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <DialogTitle>
            {monthNames[month]} {year}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextMonth}
            className="rounded-full"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </DialogHeader>

        <div className="mt-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((dayName) => (
              <div
                key={dayName}
                className="h-8 flex items-center justify-center text-xs font-medium text-gray-500"
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const appointmentCount = getAppointmentCount(day)
              return (
                <div
                  key={index}
                  onClick={() => day && setSelectedDay(day)}
                  className={`h-12 flex flex-col items-center justify-center rounded-md border text-sm relative ${
                    day === null
                      ? "border-transparent"
                      : isAppointmentDay(day)
                      ? "bg-blue-500 text-white font-semibold hover:bg-blue-600"
                      : "bg-gray-50 hover:bg-gray-100 border-gray-200"
                  } ${day ? "cursor-pointer" : ""}`}
                >
                  {day && (
                    <>
                      <span>{day}</span>
                      {appointmentCount > 0 && (
                        <span className="text-xs opacity-75">
                          {appointmentCount > 1 ? `${appointmentCount}` : ""}
                        </span>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Appointment list for selected day */}
        {selectedDay && (
          <div className="mt-4 border-t pt-3">
            <h3 className="text-sm font-medium mb-2">
              Appointments on {monthNames[month]} {selectedDay}, {year}
            </h3>
            {getAppointmentsForDay(selectedDay).length > 0 ? (
              <ul className="space-y-2 text-sm">
                {getAppointmentsForDay(selectedDay).map((appt, idx) => (
                  <li
                    key={idx}
                    className="p-2 border rounded bg-gray-50 flex justify-between"
                  >
                    <span>{appt.title || "Appointment"}</span>
                    <span className="text-gray-600">{appt.time}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">
                No appointments for this day
              </p>
            )}
          </div>
        )}

        {schedule.length === 0 && (
          <p className="text-center text-gray-500 mt-4 text-sm">
            No appointments scheduled
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}