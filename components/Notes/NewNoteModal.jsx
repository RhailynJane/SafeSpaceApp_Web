'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { FileText } from "lucide-react"

export default function NewNoteModal({ isOpen, onClose, clients = [], onSave }) {
  const [formData, setFormData] = useState({
    client_id: '',
    session_type: '',
    note_date: new Date().toISOString().split('T')[0],
    duration_minutes: '',
    summary: '',
    detailed_notes: '',
    risk_assessment: '',
    next_steps: ''
  });

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            New Session Note
          </DialogTitle>
          <DialogDescription>
            Document a new client session
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={formData.client_id} onValueChange={(value) => setFormData(prev => ({...prev, client_id: parseInt(value)}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id.toString()}>{client.client_first_name} {client.client_last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Session Type</Label>
              <Select value={formData.session_type} onValueChange={(value) => setFormData(prev => ({...prev, session_type: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input 
                type="date" 
                value={formData.note_date}
                onChange={(e) => setFormData(prev => ({...prev, note_date: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input 
                type="number" 
                placeholder="50" 
                value={formData.duration_minutes}
                onChange={(e) => setFormData(prev => ({...prev, duration_minutes: parseInt(e.target.value)}))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Session Summary</Label>
            <Textarea 
              placeholder="Brief summary of the session..." 
              className="min-h-16 resize-none"
              value={formData.summary}
              onChange={(e) => setFormData(prev => ({...prev, summary: e.target.value}))}
            />
          </div>
          <div className="space-y-2">
            <Label>Detailed Notes</Label>
            <Textarea 
              placeholder="Detailed session notes..." 
              className="min-h-20 resize-none"
              value={formData.detailed_notes}
              onChange={(e) => setFormData(prev => ({...prev, detailed_notes: e.target.value}))}
            />
          </div>
          <div className="space-y-2">
            <Label>Next Steps / Action Items</Label>
            <Textarea 
              placeholder="Follow-up actions, homework, next appointment..."
              className="min-h-16 resize-none"
              value={formData.next_steps}
              onChange={(e) => setFormData(prev => ({...prev, next_steps: e.target.value}))}
            />
          </div>
          <div className="space-y-2">
            <Label>Risk Assessment</Label>
            <Select value={formData.risk_assessment} onValueChange={(value) => setFormData(prev => ({...prev, risk_assessment: value}))}>
              <SelectTrigger>
                <SelectValue placeholder="Current risk level" />
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
          <Button onClick={handleSave} disabled={!formData.client_id}>Save Note</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
