"use client"

// This file includes code comments generated with the assistance of ChatGPT by OpenAI.

import { useState } from "react"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select, SelectTrigger, SelectValue,
  SelectContent, SelectItem
} from "@/components/ui/select"
import { Phone } from "lucide-react"

export default function CrisisHotlineModal({ isOpen, onClose }) {
  // State to store form data: call purpose and optional client info
  const [formData, setFormData] = useState({
    purpose: '',      // Reason for calling the crisis hotline (required)
    clientInfo: ''    // Optional client identifier or initials
  })

  // Handler when user clicks the Call 988 button
  const handleCrisisCall = () => {
    console.log('Crisis hotline call:', formData) // Log form data for debugging
    onClose()                                    // Close the modal dialog
    alert('Connecting to 988 Crisis Lifeline...') // Notify user of connection
    setFormData({ purpose: '', clientInfo: '' })  // Reset form fields
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Crisis Hotline (988)
          </DialogTitle>
          <DialogDescription>
            Connect to the National Suicide Prevention Lifeline
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informational box about the 988 Lifeline */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded">
            <p className="text-sm text-blue-800">
              The 988 Lifeline provides 24/7, free and confidential support for people in distress, 
              prevention and crisis resources for you or your loved ones.
            </p>
          </div>

          {/* Dropdown to select the purpose of the call */}
          <div className="space-y-2">
            <Label>Call Purpose *</Label>
            <Select
              value={formData.purpose}
              onValueChange={(value) =>
                setFormData(prev => ({ ...prev, purpose: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select the reason for your call" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">For a client in crisis</SelectItem>
                <SelectItem value="consultation">Professional consultation</SelectItem>
                <SelectItem value="personal">Personal support needed</SelectItem>
                <SelectItem value="resources">Resource information</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Optional input for client information */}
          <div className="space-y-2">
            <Label>Client Information (if applicable)</Label>
            <Input
              placeholder="Client initials or ID (optional)..."
              value={formData.clientInfo}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, clientInfo: e.target.value }))
              }
            />
          </div>

          {/* List of available services provided by the hotline */}
          <div className="bg-gray-50 p-3 rounded">
            <h4 className="text-sm font-medium mb-2">Available Services:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Crisis counseling and emotional support</li>
              <li>• Suicide prevention</li>
              <li>• Crisis de-escalation</li>
              <li>• Resource and referral information</li>
              <li>• Follow-up services</li>
            </ul>
          </div>
        </div>

        {/* Modal footer with Cancel and Call buttons */}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleCrisisCall}
            disabled={!formData.purpose}  // Disable button until purpose selected
          >
            <Phone className="h-4 w-4 mr-2" />
            Call 988
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
