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
              <p className="text-sm font-medium">{note.client.client_first_name} {note.client.client_last_name}</p>
            </div>
            <div>
              <Label>Session Type</Label>
              <p className="text-sm font-medium">{note.session_type}</p>
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
              {note.detailed_notes || 'No detailed notes provided.'}
            </p>
          </div>
          <div>
            <Label>Next Steps</Label>
            <p className="text-sm bg-gray-50 p-3 rounded">
              {note.next_steps || 'No next steps provided.'}
            </p>
          </div>
          <div>
            <Label>Risk Assessment</Label>
            <Badge variant="secondary">{note.risk_assessment || 'N/A'}</Badge>
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