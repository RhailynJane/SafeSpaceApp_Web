"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { User, Phone, Clock } from "lucide-react"

export default function CallSupervisorModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    reason: '',
    urgency: 'normal',
    clientContext: '',
    specificQuestion: '',
    preferredSupervisor: 'oncall'
  })

  const handleSupervisorCall = () => {
    console.log('Supervisor call initiated:', formData)
    onClose()
    
    // Show different messages based on urgency
    const urgencyText = formData.urgency === 'emergency' ? 'Emergency call to supervisor...' : 
                       formData.urgency === 'urgent' ? 'Urgent call to supervisor...' : 'Calling supervisor...'
    
    alert(urgencyText)
    
    // Reset form
    setFormData({
      reason: '',
      urgency: 'normal',
      clientContext: '',
      specificQuestion: '',
      preferredSupervisor: 'oncall'
    })
  }

  const supervisors = [
    { id: 'oncall', name: 'Dr. Sarah Mitchell', role: 'On-Call Supervisor', phone: '(555) 999-1234', availability: 'Available 24/7' },
    { id: 'primary', name: 'Dr. Michael Roberts', role: 'Primary Supervisor', phone: '(555) 888-5678', availability: 'Mon-Fri 8AM-6PM' },
    { id: 'clinical', name: 'Dr. Jennifer Adams', role: 'Clinical Director', phone: '(555) 777-9012', availability: 'Mon-Fri 9AM-5PM' }
  ]

  const selectedSupervisor = supervisors.find(s => s.id === formData.preferredSupervisor)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Contact Supervisor
          </DialogTitle>
          <DialogDescription>
            Reach out to your supervisor for guidance or consultation
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {/* Selected Supervisor Info */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{selectedSupervisor?.name}</h4>
              <Badge variant="outline">{selectedSupervisor?.role}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>{selectedSupervisor?.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{selectedSupervisor?.availability}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Select Supervisor</Label>
            <Select value={formData.preferredSupervisor} onValueChange={(value) => setFormData(prev => ({...prev, preferredSupervisor: value}))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {supervisors.map(supervisor => (
                  <SelectItem key={supervisor.id} value={supervisor.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{supervisor.name}</span>
                      <span className="text-xs text-gray-500">{supervisor.role} • {supervisor.availability}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Reason for Contact *</Label>
            <Select value={formData.reason} onValueChange={(value) => setFormData(prev => ({...prev, reason: value}))}>
              <SelectTrigger>
                <SelectValue placeholder="Select the reason for contacting supervisor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="emergency">Emergency consultation</SelectItem>
                <SelectItem value="clinical">Clinical guidance needed</SelectItem>
                <SelectItem value="ethical">Ethical consultation</SelectItem>
                <SelectItem value="crisis">Crisis intervention support</SelectItem>
                <SelectItem value="case">Case management advice</SelectItem>
                <SelectItem value="policy">Policy clarification</SelectItem>
                <SelectItem value="training">Training/development</SelectItem>
                <SelectItem value="administrative">Administrative matter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Urgency Level *</Label>
            <Select value={formData.urgency} onValueChange={(value) => setFormData(prev => ({...prev, urgency: value}))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="emergency">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span>Emergency - Immediate response needed</span>
                  </div>
                </SelectItem>
                <SelectItem value="urgent">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Urgent - Response within 1 hour</span>
                  </div>
                </SelectItem>
                <SelectItem value="normal">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Normal - Response within 24 hours</span>
                  </div>
                </SelectItem>
                <SelectItem value="low">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span>Low priority - Response when convenient</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Client Context (if applicable)</Label>
            <Textarea 
              placeholder="Provide client initials or case details if this consultation is related to a specific client situation..."
              value={formData.clientContext}
              onChange={(e) => setFormData(prev => ({...prev, clientContext: e.target.value}))}
              className="min-h-20 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Specific Question or Concern *</Label>
            <Textarea 
              placeholder="Describe the specific question, concern, or situation you need guidance on. Be as detailed as possible to help your supervisor provide the best advice..."
              value={formData.specificQuestion}
              onChange={(e) => setFormData(prev => ({...prev, specificQuestion: e.target.value}))}
              className="min-h-24 resize-none"
            />
          </div>

          {/* Emergency Notice */}
          {formData.urgency === 'emergency' && (
            <div className="bg-red-50 border border-red-200 p-3 rounded animate-pulse">
              <p className="text-sm text-red-800 font-medium">
                 Emergency Consultation: This will immediately contact the on-call supervisor regardless of your selection above.
              </p>
            </div>
          )}

          {/* Guidelines */}
          <div className="bg-gray-50 p-3 rounded">
            <h4 className="text-sm font-medium mb-2">Consultation Guidelines:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Have relevant case files or information ready before calling</li>
              <li>• Be prepared to discuss specific questions or concerns</li>
              <li>• Document the consultation outcome in your case notes</li>
              <li>• Follow up on any recommendations or action items</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSupervisorCall}
            disabled={!formData.reason || !formData.specificQuestion.trim()}
            variant={formData.urgency === 'emergency' ? 'destructive' : 'default'}
          >
            <Phone className="h-4 w-4 mr-2" />
            {formData.urgency === 'emergency' ? 'Emergency Call' : 'Contact Supervisor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}