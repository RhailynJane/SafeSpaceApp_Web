
// Import React hook for local state management
import { useState } from "react"

// Import UI components from your local UI library (likely using Radix UI / TailwindCSS)
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

/**
 * MessageModal Component
 * NOTE: This component was created with assistance from ChatGPT (OpenAI).
 * ChatGPT helped generate comment on this code.
 * 
 * A modal dialog for sending a message to a specific client.
 * It receives the following props:
 * - open (boolean): controls the visibility of the dialog
 * - onOpenChange (function): callback to toggle modal open/close state
 * - client (object): the recipient of the message (must contain `name` key)
 *
 * @param {boolean} open - Modal open state
 * @param {function} onOpenChange - Function to update modal visibility
 * @param {object} client - Object containing client details (e.g., name)
 */
export default function MessageModal({ open, onOpenChange, client }) {
  // Local state to manage the input message
  const [message, setMessage] = useState("")

  /**
   * Handler for sending the message
   * In a real-world app, this could integrate with a messaging API or email service.
   * For now, it logs the message to the console and closes the modal.
   */
  const handleSend = () => {
    console.log(`Message to ${client.name}: ${message}`) // Debug log
    onOpenChange(false) // Close the modal after sending
  }

  return (
    // Root Dialog component (controlled by `open` prop)
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Modal Header */}
        <DialogHeader>
          <DialogTitle>Send Message to {client.name}</DialogTitle>
        </DialogHeader>

        {/* Message Form Body */}
        <div className="space-y-2">
          {/* Message Label */}
          <Label>Message</Label>

          {/* Textarea for typing the message */}
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)} // Updates local state as user types
            placeholder="Type your message..."
          />

          {/* Submit Button to trigger handleSend */}
          <Button onClick={handleSend} className="mt-2">
            Send
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
