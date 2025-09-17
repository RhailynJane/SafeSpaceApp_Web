import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

export default function MessageModal({ open, onOpenChange, client }) {
  const [message, setMessage] = useState("")

  const handleSend = () => {
    console.log(`Message to ${client.name}: ${message}`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Message to {client.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Message</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
          />
          <Button onClick={handleSend} className="mt-2">Send</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
