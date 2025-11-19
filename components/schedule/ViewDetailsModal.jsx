'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Video } from 'lucide-react'
import VideoCallModal from './VideoCallModal'

export default function ViewDetailsModal({ appointment }) {
  const [open, setOpen] = useState(false)
  const [isCallModalOpen, setIsCallModalOpen] = useState(false)

  if (!appointment) {
    return null
  }

  const handleJoinCall = () => {
    setIsCallModalOpen(true)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">View Details</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold">Client</h3>
              <p>{appointment.client?.client_first_name} {appointment.client?.client_last_name || 'Unknown Client'}</p>
            </div>
            <div>
              <h3 className="font-semibold">Time</h3>
              <p>
                {appointment.appointment_time
                  ? new Date(appointment.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'No time set'
                }
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Duration</h3>
              <p>{appointment.duration}</p>
            </div>
            <Button className="w-full mt-6" onClick={handleJoinCall}>
              <Video className="mr-2 h-4 w-4" />
              Join Call
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {isCallModalOpen && (
        <VideoCallModal
          appointment={appointment}
          open={isCallModalOpen}
          onOpenChange={setIsCallModalOpen}
        />
      )}
    </>
  )
}
