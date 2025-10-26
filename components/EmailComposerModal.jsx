import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Loader2 } from "lucide-react";

const EmailComposerModal = ({ isOpen, onClose, referral }) => {
  const [to, setTo] = useState(referral?.email || '');
  const [subject, setSubject] = useState(`More information for referral: ${referral?.client_first_name || ''} ${referral?.client_last_name || ''}`);
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null); // 'success' or 'error'

  const handleSubmit = async () => {
    setIsSending(true);
    setSendStatus(null);
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: to,
          subject,
          body,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      setSendStatus('success');
      console.log("Email sent successfully!");
      alert(`Email sent successfully!`);
    } catch (error) {
      console.error("Error sending email:", error);
      setSendStatus('error');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (isSending) return;
    setTo(referral?.email || '');
    setSubject(`More information for referral: ${referral?.client_first_name || ''} ${referral?.client_last_name || ''}`);
    setBody("");
    setSendStatus(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Compose Email
          </DialogTitle>
          <DialogDescription>
            Send an email to the referral source to request more information.
          </DialogDescription>
        </DialogHeader>

        {sendStatus === 'success' ? (
          <div className="py-8 text-center">
            <h3 className="text-lg font-medium text-green-600">Email Sent Successfully!</h3>
            <p className="text-sm text-gray-600 mt-2">
              The email has been sent successfully.
            </p>
            <Button onClick={handleClose} className="mt-4">Close</Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="to">To</Label>
                <Input id="to" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Recipient's email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Email subject"
                  value={subject || ''}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body">Body</Label>
                <Textarea
                  id="body"
                  placeholder="Compose your email..."
                  value={body || ''}
                  onChange={(e) => setBody(e.target.value)}
                  className="min-h-[200px]"
                />
              </div>
              {sendStatus === 'error' && (
                <p className="text-sm text-red-600">Failed to send email. Please try again.</p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={isSending}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSending || !to || !subject || !body}>
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Email"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EmailComposerModal;
