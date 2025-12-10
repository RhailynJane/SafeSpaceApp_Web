"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Edit, Plus, Trash2 } from "lucide-react"

const COMMON_ACTIVITIES = [
  "Assessment",
  "Daily Living Support",
  "Documentation",
  "Crisis Intervention",
  "Counseling",
  "Case Management",
  "Phone Call",
  "Home Visit",
  "Group Session",
  "Treatment Planning"
];

export default function EditNoteModal({ isOpen, onClose, note, onSave }) {
  const [formData, setFormData] = useState({
    client_id: '',
    note_date: '',
    summary: '',
    detailed_notes: '',
    risk_assessment: '',
    next_steps: '',
    activities: []
  });

  const [newActivity, setNewActivity] = useState({ type: '', minutes: '' });

  const totalMinutes = useMemo(() => {
    return formData.activities.reduce((sum, activity) => sum + (parseInt(activity.minutes) || 0), 0);
  }, [formData.activities]);

  useEffect(() => {
    if (note) {
      const noteDate = note.note_date ? new Date(note.note_date) : new Date();
      const year = noteDate.getFullYear();
      const month = String(noteDate.getMonth() + 1).padStart(2, '0');
      const day = String(noteDate.getDate()).padStart(2, '0');
      const dateFormatted = `${year}-${month}-${day}`;

      setFormData({
        id: note.id,
        client_id: note.client_id,
        note_date: dateFormatted,
        summary: note.summary || '',
        detailed_notes: note.detailed_notes || '',
        risk_assessment: note.risk_assessment || '',
        next_steps: note.next_steps || '',
        activities: note.activities || []
      });
    }
  }, [note]);

  const handleAddActivity = () => {
    if (newActivity.type && newActivity.minutes) {
      setFormData(prev => ({
        ...prev,
        activities: [...prev.activities, { ...newActivity, minutes: parseInt(newActivity.minutes) }]
      }));
      setNewActivity({ type: '', minutes: '' });
    }
  };

  const handleRemoveActivity = (index) => {
    setFormData(prev => ({
      ...prev,
      activities: prev.activities.filter((_, i) => i !== index)
    }));
  };

  const handleQuickAddActivity = (activityType) => {
    const existing = formData.activities.find(a => a.type === activityType);
    if (existing) return;
    
    if (newActivity.type === '' && newActivity.minutes === '') {
      setNewActivity({ type: activityType, minutes: '' });
    } else {
      setFormData(prev => ({
        ...prev,
        activities: [...prev.activities, { type: activityType, minutes: '' }]
      }));
    }
  };

  const handleUpdateActivityMinutes = (index, minutes) => {
    setFormData(prev => ({
      ...prev,
      activities: prev.activities.map((activity, i) => 
        i === index ? { ...activity, minutes: parseInt(minutes) || 0 } : activity
      )
    }));
  };

  const handleSave = () => {
    const dataToSave = {
      ...formData,
      duration_minutes: totalMinutes
    };
    onSave(dataToSave);
  };

  if (!note) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4 border-b">
          <DialogTitle className="text-xl font-semibold">Edit Session Note</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-8 py-2">
          {/* Client and Date */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-medium text-sm">Client</Label>
                <Input 
                  value={note?.client ? `${note.client.client_first_name} ${note.client.client_last_name}` : ''} 
                  disabled 
                  className="bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-sm">Date</Label>
                <Input 
                  type="date" 
                  value={formData.note_date}
                  onChange={(e) => setFormData(prev => ({...prev, note_date: e.target.value}))}
                  className="bg-white"
                />
              </div>
            </div>
          </div>

          {/* Case Notes Section */}
          <div className="space-y-4 pt-2 border-t">
            <h3 className="font-semibold text-sm text-gray-700">Case Notes</h3>
            
            <div className="space-y-2">
              <Label className="font-medium text-sm">Session Summary</Label>
              <Textarea 
                placeholder="Brief summary of the session..." 
                className="min-h-20 resize-none bg-white"
                value={formData.summary}
                onChange={(e) => setFormData(prev => ({...prev, summary: e.target.value}))}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-medium text-sm">Detailed Notes</Label>
              <Textarea 
                placeholder="Document the client interaction..." 
                className="min-h-32 resize-none bg-white"
                value={formData.detailed_notes}
                onChange={(e) => setFormData(prev => ({...prev, detailed_notes: e.target.value}))}
              />
            </div>
          </div>

          {/* Common Activities (moved above Time Tracking) */}
          <div className="space-y-3 pt-2 border-t">
            <Label className="text-sm font-medium text-gray-700">Common Activities</Label>
            <div className="flex flex-wrap gap-2">
              {COMMON_ACTIVITIES.map(activity => (
                <Button
                  key={activity}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAddActivity(activity)}
                  disabled={formData.activities.some(a => a.type === activity)}
                  className="text-sm"
                >
                  {activity}
                </Button>
              ))}
            </div>
          </div>

          {/* Time Tracking Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-gray-700">Time Tracking</h3>
              <Button 
                type="button"
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (newActivity.type) {
                    handleAddActivity();
                  }
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Activity
              </Button>
            </div>

            {/* Activity Input Row */}
            <div className="grid grid-cols-12 gap-3 items-end bg-gray-50 p-4 rounded-lg border">
              <div className="col-span-8 space-y-2">
                <Label className="text-sm text-gray-600">Activity Type</Label>
                <Input 
                  placeholder="Type activity or select from common activities"
                  value={newActivity.type}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, type: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newActivity.type && newActivity.minutes) {
                      e.preventDefault();
                      handleAddActivity();
                    }
                  }}
                  className="bg-white"
                />
              </div>
              <div className="col-span-4 space-y-2">
                <Label className="text-sm text-gray-600">Minutes</Label>
                <Input 
                  type="number"
                  min="0"
                  placeholder="0"
                  value={newActivity.minutes}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, minutes: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newActivity.type && newActivity.minutes) {
                      e.preventDefault();
                      handleAddActivity();
                    }
                  }}
                  className="bg-white"
                />
              </div>
            </div>

            {/* Activities List */}
            {formData.activities.length > 0 && (
              <div className="space-y-3 mt-4">
                <Label className="text-sm font-medium text-gray-700">Activity Log</Label>
                <div className="space-y-2">
                  {formData.activities.map((activity, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-center p-3 bg-gray-50 rounded-lg border">
                      <div className="col-span-8">
                        <p className="font-medium text-gray-900">{activity.type}</p>
                      </div>
                      <div className="col-span-3">
                        <Input 
                          type="number"
                          min="0"
                          placeholder="0"
                          value={activity.minutes === '' ? '' : activity.minutes}
                          onChange={(e) => handleUpdateActivityMinutes(index, e.target.value)}
                          className="bg-white h-9"
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveActivity(index)}
                          className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total Time */}
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg mt-4">
              <span className="font-semibold text-gray-900">Total Time:</span>
              <span className="text-lg font-bold text-blue-700">{totalMinutes} minutes</span>
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="space-y-4 pt-2 border-t">
            <h3 className="font-semibold text-sm text-gray-700">Additional Information</h3>
            
            <div className="space-y-2">
              <Label className="font-medium text-sm">Next Steps / Action Items</Label>
              <Textarea 
                placeholder="Follow-up actions, homework, next appointment..."
                className="min-h-20 resize-none bg-white"
                value={formData.next_steps}
                onChange={(e) => setFormData(prev => ({...prev, next_steps: e.target.value}))}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-medium text-sm">Risk Assessment</Label>
              <Select 
                value={formData.risk_assessment} 
                onValueChange={(value) => setFormData(prev => ({...prev, risk_assessment: value}))}
              >
                <SelectTrigger className="bg-white">
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

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Risk Assessment</Label>
              <Select 
                value={formData.risk_assessment} 
                onValueChange={(value) => setFormData(prev => ({...prev, risk_assessment: value}))}
              >
                <SelectTrigger className="bg-white">
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
        </div>

        <DialogFooter className="flex-shrink-0 mt-6 pt-4 border-t gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSave}
            className="bg-teal-600 hover:bg-teal-700"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}