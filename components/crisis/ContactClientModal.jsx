"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Phone, Mail, MessageSquare } from "lucide-react"

export default function ContactClientModal({ isOpen, onClose, client }) {
  const [formData, setFormData] = useState({
    contactMethod: '',
    purpose: '',
    notes: '',
    urgency: 'normal'
  })

  const handleContact = () => {
    console.log('Contacting client:', { client: client?.name, ...formData })
    onClose()
    
    // Show different messages based on contact method
    const methodText = formData.contactMethod === 'call' ? 'Calling' : 
                      formData.contactMethod === 'text' ? 'Sending text to' : 'Emailing'
    
    alert(`${methodText} ${client?.name}...`)
    
    // Reset form
    setFormData({
      contactMethod: '',
      purpose: '',
      notes: '',
      urgency: 'normal'
    })
  }

  const getContactIcon = () => {
    switch(formData.contactMethod) {
      case 'call': return <Phone className="h-4 w-4" />
      case 'text': return <MessageSquare className="h-4 w-4" />
      case 'email': return <Mail className="h-4 w-4" />
      default: return <Phone className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contact Client
          </DialogTitle>
          <DialogDescription>
            Reach out to {client?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Client Info Display */}
          <div className="bg-blue-50 border border-blue-200 p-3 rounded">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{client?.name}</p>
                <p className="text-sm text-gray-600">Risk Level: {client?.risk}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Last Contact:</p>
                <p className="text-sm font-medium">{client?.lastContact}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Contact Method *</Label>
            <Select value={formData.contactMethod} onValueChange={(value) => setFormData(prev => ({...prev, contactMethod: value}))}>
              <SelectTrigger>
                <SelectValue placeholder="How would you like to contact them?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="call">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Call
                  </div>
                </SelectItem>
                <SelectItem value="text">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Text Message
                  </div>
                </SelectItem>
                <SelectItem value="email">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Purpose *</Label>
            <Select value={formData.purpose} onValueChange={(value) => setFormData(prev => ({...prev, purpose: value}))}>
              <SelectTrigger>
                <SelectValue placeholder="Reason for contact" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wellness">Wellness Check</SelectItem>
                <SelectItem value="crisis">Crisis Check-in</SelectItem>
                <SelectItem value="followup">Follow-up Contact</SelectItem>
                <SelectItem value="appointment">Appointment Reminder</SelectItem>
                <SelectItem value="support">Emotional Support</SelectItem>
                <SelectItem value="safety">Safety Concern</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Urgency Level</Label>
            <Select value={formData.urgency} onValueChange={(value) => setFormData(prev => ({...prev, urgency: value}))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Priority</SelectItem>
                <SelectItem value="normal">Normal Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Contact Notes</Label>
            <Textarea 
              placeholder="Notes about this contact attempt, concerns, or specific topics to discuss..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
              className="min-h-20 resize-none"
            />
          </div>

          {/* Contact Information Display */}
          <div className="bg-gray-50 p-3 rounded">
            <h4 className="text-sm font-medium mb-2">Client Contact Information:</h4>
            <div className="text-sm space-y-1">
              <p> Phone: (555) 123-4567</p>
              <p> Email: client@example.com</p>
              <p> Address: 123 Main St, City, State</p>
            </div>
          </div>

          {formData.urgency === 'urgent' && (
            <div className="bg-red-50 border border-red-200 p-3 rounded">
              <p className="text-sm text-red-800 font-medium">
                 Urgent Contact: Consider immediate intervention if client doesn't respond.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleContact}
            disabled={!formData.contactMethod || !formData.purpose}
          >
            {getContactIcon()}
            <span className="ml-2">Contact Now</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}