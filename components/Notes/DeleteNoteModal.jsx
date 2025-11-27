"use client"

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function DeleteNoteModal({ isOpen, onClose, onConfirm, noteSummary }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Delete Session Note
          </DialogTitle>
          <DialogDescription className="pt-2">
            Are you sure you want to delete this note? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        {noteSummary && (
          <div className="py-3">
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border">
              <span className="font-medium">Note: </span>
              {noteSummary.length > 100 ? noteSummary.substring(0, 100) + '...' : noteSummary}
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
