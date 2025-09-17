"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react"

export default function UpdateRiskStatusModal({ isOpen, onClose, client }) {
  const [formData, setFormData] = useState({
    newRiskLevel: '',
    reasonForChange: '',
    actionPlan: '',
    followUpDate: '',
    notifyOthers: false
  })

  useEffect(() => {
    if (client) {
      setFormData({
        newRiskLevel: '',
        reasonForChange: '',
        actionPlan: '',
        followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week from now
        notifyOthers: false
      })
    }
  }, [client])

  const handleUpdate = () => {
    console.log('Risk status update:', { client: client?.name, ...formData })
    onClose()
    alert(`Risk status updated for ${client?.name}`)
    
    // Reset form
    setFormData({
      newRiskLevel: '',
      reasonForChange: '',
      actionPlan: '',
      followUpDate: '',
      notifyOthers: false
    })
  }

  const getRiskBadgeVariant = (risk) => {
    switch(risk?.toLowerCase()) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'outline'
    }
  }

  const getRiskChangeIcon = () => {
    if (!formData.newRiskLevel || !client?.risk) return <Minus className="h-4 w-4" />
    
    const currentLevel = ['low', 'medium', 'high', 'critical'].indexOf(client.risk.toLowerCase())
    const newLevel = ['low', 'medium', 'high', 'critical'].indexOf(formData.newRiskLevel.toLowerCase())
    
    if (newLevel > currentLevel) return <TrendingUp className="h-4 w-4 text-red-500" />
    if (newLevel < currentLevel) return <TrendingDown className="h-4 w-4 text-green-500" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  const getRiskChangeText = () => {
    if (!formData.newRiskLevel || !client?.risk) return ''
    
    const currentLevel = ['low', 'medium', 'high', 'critical'].indexOf(client.risk.toLowerCase())
    const newLevel = ['low', 'medium', 'high', 'critical'].indexOf(formData.newRiskLevel.toLowerCase())
    
    if (newLevel > currentLevel) return 'Risk Level Increasing'
    if (newLevel < currentLevel) return 'Risk Level Decreasing'
    return 'Risk Level Unchanged'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Update Risk Assessment
          </DialogTitle>
          <DialogDescription>
            Update the risk assessment for {client?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {/* Current Status Display */}
          <div className="bg-gray-50 border p-4 rounded">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Current Risk Assessment</h4>
              <Badge variant={getRiskBadgeVariant(client?.risk)}>
                {client?.risk} Risk
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Client:</p>
                <p className="font-medium">{client?.name}</p>
              </div>
              <div>
                <p className="text-gray-600">Last Contact:</p>
                <p className="font-medium">{client?.lastContact}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-600">Current Concern:</p>
                <p className="font-medium">{client?.reason}</p>
              </div>
            </div>
          </div>

          {/* Risk Change Indicator */}
          {formData.newRiskLevel && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded">
              <div className="flex items-center gap-2 mb-2">
                {getRiskChangeIcon()}
                <span className="font-medium text-sm">{getRiskChangeText()}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span>From: <Badge variant={getRiskBadgeVariant(client?.risk)} className="ml-1">{client?.risk}</Badge></span>
                <span>To: <Badge variant={getRiskBadgeVariant(formData.newRiskLevel)} className="ml-1">{formData.newRiskLevel}</Badge></span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>New Risk Level *</Label>
            <Select value={formData.newRiskLevel} onValueChange={(value) => setFormData(prev => ({...prev, newRiskLevel: value}))}>
              <SelectTrigger>
                <SelectValue placeholder="Select new risk level" />
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
            <Label>Reason for Change *</Label>
            <Textarea 
              placeholder="Explain the specific reasons for this risk level change. Include observations, client statements, behaviors, or circumstances that support this assessment..."
              value={formData.reasonForChange}
              onChange={(e) => setFormData(prev => ({...prev, reasonForChange: e.target.value}))}
              className="min-h-24 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Action Plan *</Label>
            <Textarea 
              placeholder="Detail the specific actions, interventions, and monitoring plans based on this risk level. Include frequency of contact, safety measures, and treatment modifications..."
              value={formData.actionPlan}
              onChange={(e) => setFormData(prev => ({...prev, actionPlan: e.target.value}))}
              className="min-h-24 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Follow-up Date</Label>
              <input 
                type="date" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.followUpDate}
                onChange={(e) => setFormData(prev => ({...prev, followUpDate: e.target.value}))}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label>Notify Others</Label>
              <div className="flex items-center space-x-2 mt-3">
                <input 
                  type="checkbox" 
                  id="notify"
                  checked={formData.notifyOthers}
                  onChange={(e) => setFormData(prev => ({...prev, notifyOthers: e.target.checked}))}
                  className="rounded"
                />
                <label htmlFor="notify" className="text-sm">
                  Notify supervisor and team members
                </label>
              </div>
            </div>
          </div>

          {/* Risk Level Guidelines */}
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
            <h4 className="text-sm font-medium mb-2">Risk Level Guidelines:</h4>
            <div className="text-xs space-y-1">
              <p><strong>Critical:</strong> Imminent danger, requires immediate intervention</p>
              <p><strong>High:</strong> Significant risk, needs intensive monitoring</p>
              <p><strong>Medium:</strong> Some risk factors present, regular check-ins needed</p>
              <p><strong>Low:</strong> Minimal risk, standard care appropriate</p>
            </div>
          </div>
        </div>
        <DialogFooter className="flex-shrink-0 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleUpdate}
            disabled={!formData.newRiskLevel || !formData.reasonForChange.trim() || !formData.actionPlan.trim()}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Update Risk Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}