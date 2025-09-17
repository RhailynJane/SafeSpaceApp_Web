"use client"

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Eye, Edit } from "lucide-react"

export default function ViewNoteModal({ isOpen, onClose, onEdit, note }) {
  if (!note) return null

  const handleEdit = () => {
    onClose()
    onEdit(note)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Session Note Details
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Client</Label>
              <p className="text-sm font-medium">{note.client}</p>
            </div>
            <div>
              <Label>Session Type</Label>
              <p className="text-sm font-medium">{note.type}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date</Label>
              <p className="text-sm font-medium">{note.date}</p>
            </div>
            <div>
              <Label>Duration</Label>
              <p className="text-sm font-medium">50 minutes</p>
            </div>
          </div>
          <div>
            <Label>Session Summary</Label>
            <p className="text-sm bg-gray-50 p-3 rounded">
              {note.summary}
            </p>
          </div>
          <div>
            <Label>Detailed Notes</Label>
            <p className="text-sm bg-gray-50 p-3 rounded min-h-24">
              {note.detailedNotes || `Client demonstrated better understanding of cognitive behavioral techniques discussed in previous sessions. 
              Reported decreased frequency of panic attacks from daily to 2-3 times per week. Homework completion was good.
              Client expressed feeling more hopeful about recovery process.`}
            </p>
          </div>
          <div>
            <Label>Next Steps</Label>
            <p className="text-sm bg-gray-50 p-3 rounded">
              {note.nextSteps || "Continue with weekly sessions. Assign anxiety management homework. Schedule follow-up in 1 week."}
            </p>
          </div>
          <div>
            <Label>Risk Assessment</Label>
            <Badge variant="secondary">Low Risk</Badge>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}