"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Edit } from "lucide-react"

export default function EditNoteModal({ isOpen, onClose, note, onSave }) {
  const [formData, setFormData] = useState({
    client_id: '',
    session_type: '',
    note_date: '',
    duration_minutes: '',
    summary: '',
    detailed_notes: '',
    risk_assessment: '',
    next_steps: ''
  });

  // Update form data when note changes
  useEffect(() => {
    if (note) {
      setFormData({
        id: note.id,
        client_id: note.client_id,
        session_type: note.session_type || '',
        note_date: note.note_date ? new Date(note.note_date).toISOString().split('T')[0] : '',
        duration_minutes: note.duration_minutes || '',
        summary: note.summary || '',
        detailed_notes: note.detailed_notes || '',
        risk_assessment: note.risk_assessment || '',
        next_steps: note.next_steps || ''
      });
    }
  }, [note]);

  const handleSave = () => {
    onSave(formData);
  };

  if (!note) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Session Note
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Client</Label>
              <Input 
                value={note.client ? `${note.client.client_first_name} ${note.client.client_last_name}` : ''} 
                disabled 
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label>Session Type</Label>
              <Select 
                value={formData.session_type} 
                onValueChange={(value) => setFormData(prev => ({...prev, session_type: value}))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual Session</SelectItem>
                  <SelectItem value="group">Group Therapy</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                  <SelectItem value="crisis">Crisis Intervention</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Session Summary</Label>
            <Textarea 
              className="min-h-16 resize-none"
              value={formData.summary}
              onChange={(e) => setFormData(prev => ({...prev, summary: e.target.value}))}
            />
          </div>
          <div className="space-y-2">
            <Label>Detailed Notes</Label>
            <Textarea 
              className="min-h-20 resize-none"
              value={formData.detailed_notes}
              onChange={(e) => setFormData(prev => ({...prev, detailed_notes: e.target.value}))}
            />
          </div>
          <div className="space-y-2">
            <Label>Next Steps / Action Items</Label>
            <Textarea 
              className="min-h-16 resize-none"
              value={formData.next_steps}
              onChange={(e) => setFormData(prev => ({...prev, next_steps: e.target.value}))}
            />
          </div>
          <div className="space-y-2">
            <Label>Risk Assessment</Label>
            <Select 
              value={formData.risk_assessment} 
              onValueChange={(value) => setFormData(prev => ({...prev, risk_assessment: value}))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
                <SelectItem value="critical">Critical Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="flex-shrink-0 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}