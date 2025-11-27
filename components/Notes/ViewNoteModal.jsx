"use client"

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Eye, Edit, Clock } from "lucide-react"
import { useMemo } from 'react'

export default function ViewNoteModal({ isOpen, onClose, onEdit, note }) {
  const totalMinutes = useMemo(() => {
    if (!note?.activities || !Array.isArray(note.activities)) return 0
    return note.activities.reduce((sum, activity) => {
      const mins = typeof activity.minutes === 'number' ? activity.minutes : 
                   typeof activity.minutes === 'string' ? parseInt(activity.minutes, 10) || 0 : 0
      return sum + mins
    }, 0)
  }, [note?.activities])

  // Debug logging
  if (note && isOpen) {
    console.log('ViewNoteModal - Full note object:', note);
    console.log('ViewNoteModal - Activities:', note.activities);
    console.log('ViewNoteModal - Total minutes:', totalMinutes);
  }

  if (!note) return null

  const handleEdit = () => {
    onClose()
    onEdit(note)
  }

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
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <Eye className="h-5 w-5" />
            Session Note Details
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-8 py-2">
          {/* Client and Date */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-medium text-sm text-gray-600 dark:text-gray-400">Client</Label>
                <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                  {note.client ? `${note.client.client_first_name} ${note.client.client_last_name}` : 'N/A'}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-sm text-gray-600 dark:text-gray-400">Date</Label>
                <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                  {note.note_date ? new Date(note.note_date + 'T00:00:00').toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Case Notes Section */}
          <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Case Notes</h3>
            
            <div className="space-y-2">
              <Label className="font-medium text-sm text-gray-600 dark:text-gray-400">Session Summary</Label>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{note.summary || 'No summary provided.'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-medium text-sm text-gray-600 dark:text-gray-400">Detailed Notes</Label>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 min-h-24">
                <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{note.detailed_notes || 'No detailed notes.'}</p>
              </div>
            </div>
          </div>

          {/* Time Tracking Section */}
          <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Time Tracking</h3>
            </div>

            {note.activities && note.activities.length > 0 ? (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Activity Log</Label>
                  <div className="space-y-2">
                    {note.activities.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{activity.type}</span>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{activity.minutes} min</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">Total Time:</span>
                  <span className="text-lg font-bold text-blue-700 dark:text-blue-400">{totalMinutes} minutes</span>
                </div>
              </>
            ) : (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
                No activities logged for this session.
              </div>
            )}
          </div>

          {/* Additional Information Section */}
          <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Additional Information</h3>
            
            <div className="space-y-2">
              <Label className="font-medium text-sm text-gray-600 dark:text-gray-400">Next Steps / Action Items</Label>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{note.next_steps || 'No action items specified.'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-medium text-sm text-gray-600">Risk Assessment</Label>
              <div className="inline-block">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  note.risk_assessment === 'critical' ? 'bg-red-100 text-red-800' :
                  note.risk_assessment === 'high' ? 'bg-orange-100 text-orange-800' :
                  note.risk_assessment === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {note.risk_assessment ? note.risk_assessment.charAt(0).toUpperCase() + note.risk_assessment.slice(1) + ' Risk' : 'Not Assessed'}
                </span>
              </div>
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

        <DialogFooter className="flex-shrink-0 mt-6 pt-4 border-t gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button 
            onClick={handleEdit}
            className="bg-teal-600 hover:bg-teal-700 gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}