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
import { Calendar } from "lucide-react"

export default function ViewCalendarModal({ schedule = [] }) {
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())

  const appointmentDatesForMonth = schedule.map(appt => {
    if (!appt?.appointment_date) return null;
    const d = new Date(appt.appointment_date);
    return {
        year: d.getUTCFullYear(),
        month: d.getUTCMonth(), // 0-indexed
        day: d.getUTCDate()
    };
  }).filter(Boolean);

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  
  const days = []
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const isAppointmentDay = (day) => {
    if (!day) return false;
    return appointmentDatesForMonth.some(apptDate => 
        apptDate.year === year &&
        apptDate.month === month &&
        apptDate.day === day
    );
  }

  const getAppointmentCount = (day) => {
    if (!day) return 0;
    return appointmentDatesForMonth.filter(apptDate => 
        apptDate.year === year &&
        apptDate.month === month &&
        apptDate.day === day
    ).length;
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const hasAppointmentsThisMonth = appointmentDatesForMonth.some(d => d.year === year && d.month === month);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Calendar className="h-4 w-4 mr-2" /> View Calendar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{monthNames[month]} {year}</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
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

          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const appointmentCount = getAppointmentCount(day)
              return (
                <div
                  key={index}
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
                          {appointmentCount > 1 ? `${appointmentCount}` : "●"}
                        </span>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {!hasAppointmentsThisMonth && (
          <p className="text-center text-gray-500 mt-4 text-sm">
            No appointments scheduled this month
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}