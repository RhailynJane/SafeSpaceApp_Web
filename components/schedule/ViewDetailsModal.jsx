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
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import VideoCallModal from './VideoCallModal'

export default function ViewDetailsModal({ appointment, onClose }) {
  const [open, setOpen] = useState(false)
  const [isCallModalOpen, setIsCallModalOpen] = useState(false)
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false)
  const [newDate, setNewDate] = useState(appointment?.appointmentDate || appointment?.date || '')
  const [newTime, setNewTime] = useState(appointment?.appointmentTime || appointment?.time || '')
  const [rescheduleReason, setRescheduleReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const cancelMutation = useMutation(api.appointments.cancelAppointment)
  const rescheduleMutation = useMutation(api.appointments.rescheduleAppointment)

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

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return
    }
    
    try {
      setLoading(true)
      console.log('🚀 Calling cancelMutation with ID:', appointment._id);
      const result = await cancelMutation({
        appointmentId: appointment._id,
        cancellationReason: 'Cancelled by support worker'
      })
      console.log('✅ Cancel result:', result);
      setOpen(false)
      if (onClose) onClose()
    } catch (err) {
      console.error('❌ Cancel error:', err);
      setError(err.message || 'Failed to cancel appointment')
    } finally {
      setLoading(false)
    }
  }

  const handleReschedule = async () => {
    if (!newDate || !newTime) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      console.log('🚀 Calling rescheduleMutation with ID:', appointment._id);
      const result = await rescheduleMutation({
        appointmentId: appointment._id,
        newDate,
        newTime,
        reason: rescheduleReason
      })
      console.log('✅ Reschedule result:', result);
      setIsRescheduleOpen(false)
      setOpen(false)
      if (onClose) onClose()
    } catch (err) {
      console.error('❌ Reschedule error:', err);
      setError(err.message || 'Failed to reschedule appointment')
    } finally {
      setLoading(false)
    }
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

            {error && (
              <div className="rounded-md border border-red-300/40 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-3 py-2 text-xs text-red-800 dark:text-red-200">
                {error}
              </div>
            )}

            {isRescheduleOpen ? (
              <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-semibold text-foreground dark:text-gray-100">Reschedule Appointment</h3>
                <div className="space-y-2">
                  <label className="text-xs font-medium">New Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">New Time</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Reason (optional)</label>
                  <textarea
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleReschedule}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Rescheduling...' : 'Confirm'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsRescheduleOpen(false)}
                    disabled={loading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleJoinCall} disabled={!canJoin}>
                  <Video className="mr-2 h-4 w-4" />
                  Join Call
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsRescheduleOpen(true)}
                  disabled={loading || appointment?.status === 'cancelled'}
                  className="flex-1"
                >
                  Reschedule
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={loading || appointment?.status === 'cancelled'}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            )}
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
