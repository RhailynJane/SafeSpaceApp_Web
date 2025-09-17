"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"

export default function ViewAvailabilityModal({ availability = [] }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Clock className="h-4 w-4 mr-2" /> View Availability
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Available Time Slots</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {availability.length > 0 ? (
            availability.map((slot, idx) => (
              <div
                key={idx}
                className="p-2 border rounded hover:bg-gray-100 cursor-pointer"
              >
                {slot.day} — {slot.time}
              </div>
            ))
          ) : (
            <p className="text-gray-600 text-sm">No availability slots found</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
