import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function ScheduleModal({ open, onOpenChange, client }) {
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")

  // Mock upcoming sessions data
  const upcomingSessions = [
    { date: "2025-09-20", time: "14:00" },
    { date: "2025-09-25", time: "10:30" },
  ]

  const handleSchedule = () => {
    console.log(`Scheduled session with ${client.name} on ${date} at ${time}`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Session with {client.name}</DialogTitle>
        </DialogHeader>

        {/* Show upcoming sessions */}
        {upcomingSessions.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Upcoming Sessions</h3>
            <ul className="list-disc pl-5 text-sm text-gray-700">
              {upcomingSessions.map((session, idx) => (
                <li key={idx}>
                  {new Date(session.date).toLocaleDateString()} at {session.time}
                </li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
