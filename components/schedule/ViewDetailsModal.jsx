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

export default function ViewDetailsModal({ message = "Details about this appointment will appear here." }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">View Details</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Details</DialogTitle>
        </DialogHeader>
        <div className="mt-2 text-gray-700">
          <p>{message}</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
