"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

export default function ViewDetailsModal({ appointment }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Appointment Details</DialogTitle>
          <DialogDescription>
            Details for <strong>{appointment.client}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 mt-2">
          <p><strong>Time:</strong> {appointment.time}</p>
          <p><strong>Type:</strong> {appointment.type}</p>
          <p><strong>Duration:</strong> {appointment.duration}</p>
          <p><strong>Details:</strong> {appointment.details}</p>
        </div>
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
