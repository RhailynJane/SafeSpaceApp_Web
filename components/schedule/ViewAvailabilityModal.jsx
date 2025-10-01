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
import { Clock } from "lucide-react"

export default function ViewAvailabilityModal({ availability = [], onSelect }) {
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [open, setOpen] = useState(false) // control dialog state

  const handleConfirm = () => {
    if (selectedSlot && onSelect) {
      onSelect(selectedSlot)
    }
    setOpen(false) // close the modal after confirming
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={() => setOpen(true)}>
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
                onClick={() => setSelectedSlot(slot)}
                className={`p-2 border rounded cursor-pointer transition
                  ${
                    selectedSlot === slot
                      ? "bg-blue-100 border-blue-500"
                      : "hover:bg-gray-100"
                  }`}
              >
                {slot.day} — {slot.time}
              </div>
            ))
          ) : (
            <p className="text-gray-600 text-sm">No availability slots found</p>
          )}
        </div>

        {/* Confirm Button */}
        {availability.length > 0 && (
          <div className="mt-4 flex justify-end">
            <Button onClick={handleConfirm} disabled={!selectedSlot}>
              Confirm Selection
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
