import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

export default function ViewProfileModal({ open, onOpenChange, client }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Client Profile: {client.name}</DialogTitle>
          <DialogDescription>Status: {client.status}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <p>Last session: {client.lastSession}</p>
          <p>Risk Level: {client.riskLevel}</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
