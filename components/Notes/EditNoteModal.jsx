"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Edit } from "lucide-react"

export default function EditNoteModal({ isOpen, onClose, note }) {
  const [formData, setFormData] = useState({
    client: '',
    sessionType: 'individual',
    date: '',
    duration: '50',
    summary: '',
    detailedNotes: '',
    nextSteps: '',
    riskLevel: 'low'
  })

  // Update form data when note changes
  useEffect(() => {
    if (note) {
      setFormData({
        client: note.client || '',
        sessionType: note.type === 'Individual Session' ? 'individual' : 
                    note.type === 'Group Therapy' ? 'group' : 'assessment',
        date: note.date || '',
        duration: '50',
        summary: note.summary || '',
        detailedNotes: note.detailedNotes || 'Client demonstrated better understanding of cognitive behavioral techniques discussed in previous sessions. Reported decreased frequency of panic attacks from daily to 2-3 times per week.',
        nextSteps: note.nextSteps || 'Continue with weekly sessions. Assign anxiety management homework.',
        riskLevel: 'low'
      })
    }
  }, [note])

  const handleSave = () => {
    // Handle save logic here
    console.log('Saving edited note:', formData)
    onClose()
  }

  if (!note) return null

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
                value={formData.client} 
                disabled 
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label>Session Type</Label>
              <Select 
                value={formData.sessionType} 
                onValueChange={(value) => setFormData(prev => ({...prev, sessionType: value}))}
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input 
                type="date" 
                value={formData.date}
                onChange={(e) => setFormData(prev => ({...prev, date: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input 
                type="number" 
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({...prev, duration: e.target.value}))}
              />
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
              value={formData.detailedNotes}
              onChange={(e) => setFormData(prev => ({...prev, detailedNotes: e.target.value}))}
            />
          </div>
          <div className="space-y-2">
            <Label>Next Steps / Action Items</Label>
            <Textarea 
              className="min-h-16 resize-none"
              value={formData.nextSteps}
              onChange={(e) => setFormData(prev => ({...prev, nextSteps: e.target.value}))}
            />
          </div>
          <div className="space-y-2">
            <Label>Risk Assessment</Label>
            <Select 
              value={formData.riskLevel} 
              onValueChange={(value) => setFormData(prev => ({...prev, riskLevel: value}))}
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