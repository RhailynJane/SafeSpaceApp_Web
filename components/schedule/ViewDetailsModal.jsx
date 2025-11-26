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
import { Video, Calendar, Clock, User, FileText, AlertCircle } from 'lucide-react'
import VideoCallModal from './VideoCallModal'

export default function ViewDetailsModal({ appointment }) {
  const [open, setOpen] = useState(false)
  const [isCallModalOpen, setIsCallModalOpen] = useState(false)

  if (!appointment) {
    return null
  }

  // Compute join-call eligibility: allow only within 60 minutes before the scheduled time
  const scheduledDateStr = String(appointment.appointment_date || appointment.date || '').substring(0, 10)
  const scheduledTimeStr = String(appointment.appointment_time || appointment.time || '')
  let canJoin = false
  let scheduledDisplay = ''
  try {
    if (scheduledDateStr && scheduledTimeStr) {
      const [hh, mm] = scheduledTimeStr.split(':').map(Number)
      const d = new Date(scheduledDateStr)
      const scheduled = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hh || 0, mm || 0, 0)
      const now = new Date()
      const diffMs = scheduled.getTime() - now.getTime()
      const diffMinutes = diffMs / 60000
      // Enable join when within the 60 minutes before scheduled time (diffMinutes <= 60 and > -1440 safeguard)
      canJoin = diffMinutes <= 60
      scheduledDisplay = `${new Date(scheduledDateStr).toLocaleDateString()} at ${scheduledTimeStr}`
    }
  } catch {}

  const handleJoinCall = () => {
    setIsCallModalOpen(true)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">View Details</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg dark:bg-gray-900 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground dark:text-gray-100">Appointment Details</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-medium text-foreground dark:text-gray-100">
                <User className="h-4 w-4" /> Client
              </div>
              <p className="text-muted-foreground dark:text-gray-400">
                {`${appointment.client?.client_first_name || ''} ${appointment.client?.client_last_name || ''}`.trim() || appointment.clientName || '—'}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-medium text-foreground dark:text-gray-100">
                <Calendar className="h-4 w-4" /> Date & Time
              </div>
              <p className="text-muted-foreground dark:text-gray-400">
                {scheduledDisplay || `${String(appointment.appointment_date || '').substring(0,10)} ${appointment.appointment_time || ''}`}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-medium text-foreground dark:text-gray-100">
                <Clock className="h-4 w-4" /> Duration
              </div>
              <p className="text-muted-foreground dark:text-gray-400">{appointment.duration || '—'}</p>
            </div>
            {appointment.details && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-medium text-foreground dark:text-gray-100">
                  <FileText className="h-4 w-4" /> Notes
                </div>
                <p className="text-muted-foreground dark:text-gray-400">{appointment.details}</p>
              </div>
            )}

            {!canJoin && (
              <div className="rounded-md border border-yellow-300/40 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800 px-3 py-2 text-xs text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                You can join the call only within 1 hour before the scheduled time.
              </div>
            )}

            <Button className="w-full mt-2" onClick={handleJoinCall} disabled={!canJoin}>
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
