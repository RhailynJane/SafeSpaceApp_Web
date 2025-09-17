"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, Shield } from "lucide-react"

export default function SafetyPlanModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    clientName: '',
    warningSigns: '',
    copingStrategies: '',
    socialSupports: '',
    professionalHelp: '',
    professionalContacts: '',
    environmentSafety: ''
  })

  const handleSave = () => {
    console.log('Safety plan saved:', formData)
    onClose()
    alert('Safety plan saved successfully')
    // Reset form
    setFormData({
      clientName: '',
      warningSigns: '',
      copingStrategies: '',
      socialSupports: '',
      professionalHelp: '',
      professionalContacts: '',
      environmentSafety: ''
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Safety Plan Template
          </DialogTitle>
          <DialogDescription>
            Create a comprehensive safety plan to help manage crisis situations
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          <div className="bg-green-50 border border-green-200 p-3 rounded">
            <p className="text-sm text-green-800">
             A safety plan is a personalized, practical plan to help someone stay safe when having thoughts of suicide.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Client Name *</Label>
            <Input 
              placeholder="Client name..."
              value={formData.clientName}
              onChange={(e) => setFormData(prev => ({...prev, clientName: e.target.value}))}
            />
          </div>

          <div className="space-y-2">
            <Label>Step 1: Warning Signs</Label>
            <p className="text-sm text-gray-600 mb-2">Personal warning signs that a crisis may be developing</p>
            <Textarea 
              placeholder="Examples: Feeling hopeless, increased anxiety, social withdrawal, sleep problems..."
              value={formData.warningSigns}
              onChange={(e) => setFormData(prev => ({...prev, warningSigns: e.target.value}))}
              className="min-h-16 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Step 2: Internal Coping Strategies</Label>
            <p className="text-sm text-gray-600 mb-2">Things I can do to take my mind off my problems without contacting another person</p>
            <Textarea 
              placeholder="Examples: Listen to music, take a walk, prayer/meditation, deep breathing, journaling..."
              value={formData.copingStrategies}
              onChange={(e) => setFormData(prev => ({...prev, copingStrategies: e.target.value}))}
              className="min-h-16 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Step 3: People and Social Settings</Label>
            <p className="text-sm text-gray-600 mb-2">People and places that provide distraction and support</p>
            <Textarea 
              placeholder="Examples: Visit family/friends, go to coffee shop, attend religious services, exercise with others..."
              value={formData.socialSupports}
              onChange={(e) => setFormData(prev => ({...prev, socialSupports: e.target.value}))}
              className="min-h-16 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Step 4: People I Can Ask for Help</Label>
            <p className="text-sm text-gray-600 mb-2">People I can ask for help during a crisis</p>
            <Textarea 
              placeholder="Include names and phone numbers of family, friends, or other support people..."
              value={formData.professionalHelp}
              onChange={(e) => setFormData(prev => ({...prev, professionalHelp: e.target.value}))}
              className="min-h-16 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Step 5: Professional Contacts</Label>
            <p className="text-sm text-gray-600 mb-2">Mental health professionals or agencies I can contact during a crisis</p>
            <Textarea 
              placeholder="Include therapist, psychiatrist, crisis hotline numbers, hospital emergency room..."
              value={formData.professionalContacts}
              onChange={(e) => setFormData(prev => ({...prev, professionalContacts: e.target.value}))}
              className="min-h-16 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Step 6: Making the Environment Safe</Label>
            <p className="text-sm text-gray-600 mb-2">Ways to restrict access to lethal means</p>
            <Textarea 
              placeholder="Examples: Remove firearms, medications, sharp objects; have someone else hold them..."
              value={formData.environmentSafety}
              onChange={(e) => setFormData(prev => ({...prev, environmentSafety: e.target.value}))}
              className="min-h-16 resize-none"
            />
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <p className="text-xs text-gray-600">
              Remember: This safety plan should be reviewed and updated regularly. 
              Keep copies in easily accessible places and share with trusted support people.
            </p>
          </div>
        </div>
        <DialogFooter className="flex-shrink-0 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSave}
            disabled={!formData.clientName.trim()}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Save Safety Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}