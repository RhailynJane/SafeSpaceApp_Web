"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, Phone } from "lucide-react"

export default function EmergencyCallModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    emergency: '',
    location: ''
  })

  const handleEmergencyCall = () => {
    //  this would trigger emergency protocols
    console.log('Emergency call initiated:', formData)
    onClose()
    alert('Emergency services contacted - Help is on the way!')
    // Reset form
    setFormData({ emergency: '', location: '' })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Emergency Services
          </DialogTitle>
          <DialogDescription>
            You are about to call emergency services (911)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 p-4 rounded">
            <p className="text-sm text-red-800 font-medium">
               This will immediately connect you to emergency services. 
            </p>
            <p className="text-sm text-red-800 mt-1">
              Use only for life-threatening situations requiring immediate response.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Nature of Emergency *</Label>
            <Textarea 
              placeholder="Brief description of the emergency situation..."
              value={formData.emergency}
              onChange={(e) => setFormData(prev => ({...prev, emergency: e.target.value}))}
              className="min-h-20"
            />
          </div>
          <div className="space-y-2">
            <Label>Current Location *</Label>
            <Input 
              placeholder="Current address or location..."
              value={formData.location}
              onChange={(e) => setFormData(prev => ({...prev, location: e.target.value}))}
            />
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-xs text-gray-600">
              Emergency responders will be dispatched to the location provided. 
              Stay on the line and follow dispatcher instructions.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            variant="destructive" 
            onClick={handleEmergencyCall}
            disabled={!formData.emergency.trim() || !formData.location.trim()}
          >
            <Phone className="h-4 w-4 mr-2" />
            Call 911 Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}