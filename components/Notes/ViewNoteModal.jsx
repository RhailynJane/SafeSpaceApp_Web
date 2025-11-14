"use client"

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Eye, Edit, Clock, Calendar, AlertCircle } from "lucide-react"

export default function ViewNoteModal({ isOpen, onClose, onEdit, note }) {
  if (!note) return null

  const handleEdit = () => {
    onClose()
    onEdit(note)
  }

  const totalMinutes = note.activities 
    ? note.activities.reduce((sum, activity) => sum + (parseInt(activity.minutes) || 0), 0)
    : note.total_minutes || 0;

  const getRiskColor = (risk) => {
    const colors = {
      low: "bg-green-100 text-green-800 border-green-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      high: "bg-orange-100 text-orange-800 border-orange-200",
      critical: "bg-red-100 text-red-800 border-red-200"
    }
    return colors[risk?.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col bg-gradient-to-br from-gray-50 to-white">
        <DialogHeader className="flex-shrink-0 border-b pb-4">
          <DialogTitle className="text-2xl font-bold text-center">
            Case Notes Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4">
          {/* Client and Date Info */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500 uppercase tracking-wide">Client</Label>
              <p className="text-lg font-semibold text-gray-900">
                {note.client?.client_first_name} {note.client?.client_last_name}
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Date
              </Label>
              <p className="text-lg font-semibold text-gray-900">
                {note.note_date ? new Date(note.note_date).toLocaleDateString(undefined, { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'N/A'}
              </p>
            </div>
          </div>

          {/* Case Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Case Notes</Label>
            <div className="text-sm bg-white border rounded-lg p-4 min-h-32">
              {note.detailed_notes || <span className="text-gray-400 italic">No detailed notes provided.</span>}
            </div>
          </div>

          {/* Time Tracking Section */}
          {note.activities && note.activities.length > 0 && (
            <div className="space-y-4 bg-white rounded-lg border p-5">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time Tracking
              </Label>

              <div className="space-y-2">
                {note.activities.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded border">
                    <span className="text-sm font-medium text-gray-700">{activity.type || 'Untitled Activity'}</span>
                    <span className="text-sm font-semibold text-teal-600">{activity.minutes} min</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <span className="text-sm font-semibold">Total Time:</span>
                <span className="text-lg font-bold text-teal-600">{totalMinutes} minutes</span>
              </div>
            </div>
          )}

          {/* Session Details */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Session Type</Label>
              <div className="bg-white border rounded-lg px-4 py-3">
                <p className="text-sm font-medium capitalize text-gray-900">
                  {note.session_type || <span className="text-gray-400 italic">Not specified</span>}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Risk Assessment
              </Label>
              <div className="bg-white border rounded-lg px-4 py-3">
                {note.risk_assessment ? (
                  <Badge className={`${getRiskColor(note.risk_assessment)} capitalize px-3 py-1`}>
                    {note.risk_assessment}
                  </Badge>
                ) : (
                  <span className="text-sm text-gray-400 italic">Not assessed</span>
                )}
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Next Steps / Action Items</Label>
            <div className="text-sm bg-white border rounded-lg p-4 min-h-20">
              {note.next_steps || <span className="text-gray-400 italic">No next steps provided.</span>}
            </div>
          </div>

          {/* Session Summary (if exists) */}
          {note.summary && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Session Summary</Label>
              <div className="text-sm bg-blue-50 border border-blue-200 rounded-lg p-4">
                {note.summary}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4 gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1 h-11"
          >
            Close
          </Button>
          <Button 
            onClick={handleEdit}
            className="flex-1 h-11 bg-teal-600 hover:bg-teal-700"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}