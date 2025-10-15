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
  const [month] = useState(new Date().getMonth()) // current month
  const [year] = useState(new Date().getFullYear())

  // Extract appointment dates (assumes appointments have `date` field "YYYY-MM-DD")
  const appointmentDates = schedule.map((appt) => appt?.date).filter(Boolean)

  // Generate days for the current month
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay() // 0 = Sunday, 1 = Monday, etc.
  
  // Create array of days including empty cells for proper calendar layout
  const days = []
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null)
  }
  
  // Add all days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const isAppointmentDay = (day) => {
    if (!day) return false
    const dayStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return appointmentDates.includes(dayStr)
  }

  const getAppointmentCount = (day) => {
    if (!day) return 0
    const dayStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return schedule.filter(appt => appt?.date === dayStr).length
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

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
                  className={`h-12 flex flex-col items-center justify-center rounded-md border text-sm relative ${
                    day === null
                      ? "border-transparent" // Empty cells
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

        {schedule.length === 0 && (
          <p className="text-center text-gray-500 mt-4 text-sm">
            No appointments scheduled this month
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}