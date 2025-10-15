// -----------------------------------------------------------------------------
// File: ReferralActions.jsx
// Description: Handles Accept / Decline / Request Info actions for client referrals.
// References: 
//   - ChatGPT (GPT-5), OpenAI, assisted in writing descriptive code comments and docstrings.
// Also helped in resolving error encountered while updating status of referral.
// -----------------------------------------------------------------------------

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Info, MessageCircle, Clock } from "lucide-react";

// -----------------------------------------------------------------------------
// Component: ReferralActions
// Props:
//   - referral: referral record object containing client + status info
//   - onStatusUpdate: callback to update parent state when referral status changes
//   - userRole: identifies the actor (default: "team-leader")
// -----------------------------------------------------------------------------
const ReferralActions = ({ referral, onStatusUpdate, userRole = "team-leader" }) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const [selectedAction, setSelectedAction] = useState(null);
  const [actionNotes, setActionNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!referral || referral.status !== "Pending") {
    return null;
  }

  // ------------------------ Action Click ------------------------
  const handleActionClick = (action) => {
    setSelectedAction(action);
    if (action === "more-info-requested") {
      setShowNotesDialog(true);
    } else {
      setShowConfirmDialog(true);
    }
  };

  // ------------------------ Confirm Action ------------------------
  const handleConfirmAction = async () => {
    if (!selectedAction || !["accepted", "declined", "more-info-requested"].includes(selectedAction)) {
      alert("Please select a valid action: Accept, Decline, or Request Info.");
      return;
    }

    setIsProcessing(true);
    try {
      const body = { status: selectedAction };
      if (selectedAction === "more-info-requested") {
        body.additional_notes = actionNotes;
      }
      if (selectedAction === "accepted") {
        body.processed_date = new Date().toISOString();
      }

      const res = await fetch(`/api/referrals/${referral.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const message = errorData.message || errorData.error || "Server error while updating referral.";
        throw new Error(message);
      }

      const updatedReferral = await res.json();
      onStatusUpdate?.(referral.id, updatedReferral);

      setShowConfirmDialog(false);
      setShowNotesDialog(false);
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error updating referral:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ------------------------ Notes Submit ------------------------
  const handleNotesSubmit = () => {
    if (actionNotes.trim()) {
      handleConfirmAction();
    } else {
      alert("Please enter a note before submitting.");
    }
  };

  // ------------------------ Reset ------------------------
  const resetState = () => {
    setSelectedAction(null);
    setActionNotes("");
    setShowConfirmDialog(false);
    setShowNotesDialog(false);
    setShowSuccessDialog(false);
  };

  // ------------------------ Action Config ------------------------
  const getActionConfig = (action) => {
    switch (action) {
      case "accepted":
        return {
          label: "Accept",
          icon: CheckCircle,
          variant: "default",
          className: "bg-teal-600 hover:bg-teal-700",
          description: "Accept this referral assigning to available support worker",
        };
      case "declined":
        return {
          label: "Decline",
          icon: XCircle,
          variant: "destructive",
          className: "",
          description: "Decline this referral with reason",
        };
      case "more-info-requested":
        return {
          label: "Request Info",
          icon: Info,
          variant: "outline",
          className: "border-blue-600 bg-blue-50 text-blue-600 hover:bg-blue-100",
          description: "Request additional information before processing",
        };
      default:
        return {
          label: action,
          icon: Clock,
          variant: "outline",
          className: "",
          description: "",
        };
    }
  };

  // ------------------------ Render ------------------------
  return (
    <>
      {/* ------------------------ Action Buttons ------------------------ */}
      <div className="flex gap-2 pt-4 border-t">
        {["accepted", "declined", "more-info-requested"].map((action) => {
          const config = getActionConfig(action);
          const Icon = config.icon;
          return (
            <Button
              key={action}
              size="sm"
              variant={config.variant}
              className={config.className}
              onClick={() => handleActionClick(action)}
              disabled={isProcessing}
            >
              <Icon className="h-4 w-4 mr-1" />
              {config.label}
            </Button>
          );
        })}
      </div>

      {/* ------------------------ Confirmation Dialog ------------------------ */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Confirm {getActionConfig(selectedAction)?.label} Referral
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {selectedAction?.toLowerCase()} the referral for{" "}
              <strong>{referral.client_first_name} {referral.client_last_name}</strong>?
              <br />
              <span className="text-sm text-gray-600 mt-2 block">
                {getActionConfig(selectedAction)?.description}
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={resetState} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={isProcessing}
              className={getActionConfig(selectedAction)?.className}
            >
              {isProcessing ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {React.createElement(getActionConfig(selectedAction)?.icon, { className: "h-4 w-4 mr-2" })}
                  Confirm {getActionConfig(selectedAction)?.label}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------ Notes Dialog ------------------------ */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Additional Information</DialogTitle>
            <DialogDescription>
              Please specify what additional information is needed for{" "}
              <strong>{referral.client_first_name} {referral.client_last_name}</strong>'s referral.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Information Needed</Label>
              <Textarea
                id="notes"
                placeholder="Please describe what additional information or documentation is required..."
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <div className="text-sm text-gray-500">
              This message will be sent to the referral source.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetState} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              onClick={handleNotesSubmit}
              disabled={!actionNotes.trim() || isProcessing}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isProcessing ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------ Success Dialog ------------------------ */}
      <Dialog open={showSuccessDialog} onOpenChange={(open) => !open && resetState()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Action Completed Successfully
            </DialogTitle>
            <DialogDescription>
              The referral for <strong>{referral.client_first_name} {referral.client_last_name}</strong> has been{" "}
              {selectedAction?.replace("-", " ")} successfully.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-center py-4">
            <Badge
              className={
                selectedAction === "accepted"
                  ? "bg-green-100 text-green-800"
                  : selectedAction === "declined"
                  ? "bg-red-100 text-red-800"
                  : "bg-orange-100 text-orange-800"
              }
            >
              {selectedAction?.replace("-", " ").toUpperCase()}
            </Badge>
          </div>

          <DialogFooter>
            <Button onClick={resetState} className="w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReferralActions;
