"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  Clock, 
  User, 
  FileText,
  X
} from "lucide-react"

export default function ViewDetailsModal({ appointment }) {
  const [isOpen, setIsOpen] = useState(false)

  if (!appointment) {
    return (
      <Button variant="outline" size="sm" onClick={() => alert('No appointment data')}>
        View Details
      </Button>
    )
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        View Details
      </Button>
      
      {/* Custom Modal - NO Dialog component used */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <h2 className="text-lg font-semibold">Appointment Details</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Client */}
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-600" />
                <div>
                  <p className="font-semibold">{appointment.client}</p>
                  <p className="text-xs text-gray-600">Client</p>
                </div>
              </div>

              {/* Date & Time */}
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <span className="text-sm">{appointment.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <span className="text-sm">{appointment.time}</span>
                </div>
              </div>

              {/* Type & Duration */}
              <div className="flex items-center justify-between">
                <Badge variant="outline">{appointment.type}</Badge>
                <span className="text-sm text-gray-600">{appointment.duration}</span>
              </div>

              {/* Notes */}
              {appointment.details && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-gray-600 mt-0.5" />
                    <p className="text-sm text-gray-700">{appointment.details}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button size="sm" className="flex-1" onClick={() => setIsOpen(false)}>
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setIsOpen(false)}>
                  Reschedule
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
