"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { useState } from "react"

export default function AddAppointmentModal({ onAdd }) {
  const [formData, setFormData] = useState({
    client: "",
    time: "",
    type: "",
    duration: "",
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.client || !formData.time) return
    onAdd({ id: Date.now(), ...formData })
    setFormData({ client: "", time: "", type: "", duration: "" })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" /> Add Appointment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Appointment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="client"
            value={formData.client}
            onChange={handleChange}
            placeholder="Client Name"
            className="border p-2 rounded w-full"
          />
          <input
            type="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
          <input
            name="type"
            value={formData.type}
            onChange={handleChange}
            placeholder="Session Type"
            className="border p-2 rounded w-full"
          />
          <input
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            placeholder="Duration"
            className="border p-2 rounded w-full"
          />
          <Button type="submit">Save</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
