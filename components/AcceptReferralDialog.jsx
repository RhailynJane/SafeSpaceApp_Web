import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { User, CheckCircle } from "lucide-react";

export default function AcceptReferralDialog({ 
  isOpen, 
  onClose, 
  referral, 
  supportWorkers,
  onConfirm 
}) {
  const [selectedWorker, setSelectedWorker] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!selectedWorker) {
      alert("Please select a support worker");
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(referral.id, selectedWorker);
      setSelectedWorker("");
      onClose();
    } catch (error) {
      console.error("Error accepting referral:", error);
      alert("Failed to accept referral. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedWorker("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Accept Referral
          </DialogTitle>
          <DialogDescription>
            Assign this referral to a support worker to begin client onboarding.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Referral Summary */}
          <div className="rounded-lg bg-gray-50 p-4 space-y-2">
            <h4 className="font-semibold text-sm text-gray-900">
              {referral?.client_first_name} {referral?.client_last_name}
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Age:</span> {referral?.age}</p>
              <p><span className="font-medium">Source:</span> {referral?.referral_source}</p>
              <p><span className="font-medium">Reason:</span> {referral?.reason_for_referral}</p>
            </div>
          </div>

          {/* Support Worker Selection */}
          <div className="space-y-2">
            <Label htmlFor="support-worker" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Assign to Support Worker
            </Label>
            <Select value={selectedWorker} onValueChange={setSelectedWorker}>
              <SelectTrigger id="support-worker">
                <SelectValue placeholder="Select a support worker..." />
              </SelectTrigger>
              <SelectContent>
                {supportWorkers && supportWorkers.length > 0 ? (
                  supportWorkers.map((worker) => (
                    <SelectItem key={worker.id} value={worker.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{worker.name}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({worker.caseload || 0} clients)
                        </span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-workers" disabled>
                    No support workers available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              The selected support worker will be notified and can begin working with this client.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedWorker || isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Accepting...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept & Assign
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}