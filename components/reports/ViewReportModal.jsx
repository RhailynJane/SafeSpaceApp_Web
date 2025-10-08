"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function ViewReportModal({ report, open, onClose }) {
  if (!report) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{report.name}</DialogTitle>
          <DialogDescription>
            {report.date} • {report.type} • {report.size}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 max-h-96 overflow-y-auto p-2 bg-gray-50 border rounded">
          {report.data ? (
            <table className="w-full text-sm text-left border-collapse">
              <tbody>
                {Object.entries(report.data).map(([key, value]) => (
                  <tr key={key} className="border-b last:border-b-0">
                    <td className="py-2 px-4 font-medium capitalize text-gray-700">{key.replace(/_/g, ' ')}</td>
                    <td className="py-2 px-4 text-gray-900">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-600 text-sm">No preview available</p>
          )}
        </div>
        <DialogFooter className="mt-4">
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
