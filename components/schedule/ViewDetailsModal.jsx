"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function ViewCalendarModal({ schedule = [] }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">View Calendar</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Calendar View</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 mt-2">
          {schedule.length > 0 ? (
            schedule.map((appt) => (
              <div key={appt.id} className="border p-2 rounded">
                <p><strong>{appt.time}</strong> – {appt.client}</p>
                <p className="text-sm text-gray-600">{appt.type} • {appt.duration}</p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">No appointments scheduled</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}