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
//   - referral: the referral record object containing client and status info
//   - onStatusUpdate: callback function to update referral status in parent component
//   - userRole: defines who is performing the action (default: team-leader)
// -----------------------------------------------------------------------------
const ReferralActions = ({ referral, onStatusUpdate, userRole = "team-leader" }) => {

  // --- UI state variables for dialog visibility and button processing ---
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // --- Logic state variables for action and note management ---
  const [selectedAction, setSelectedAction] = useState(null);  // e.g. "accepted", "declined"
  const [actionNotes, setActionNotes] = useState("");          // user-entered note for "request info"
  const [isProcessing, setIsProcessing] = useState(false);     // loading spinner indicator

  // --- Hide all action buttons if referral is not in "Pending" status ---
  if (referral.status !== "Pending") {
    return null;
  }

  // ---------------------------------------------------------------------------
  // handleActionClick(action)
  // Handles button click events for Accept, Decline, or Request Info actions.
  // Opens either confirmation or notes dialog based on selected action.
  // ---------------------------------------------------------------------------
  const handleActionClick = (action) => {
    setSelectedAction(action);
    if (action === "more-info-requested") {
      setShowNotesDialog(true); // open notes modal for more info
    } else {
      setShowConfirmDialog(true); // open confirm modal for accept/decline
    }
  };

  // ---------------------------------------------------------------------------
  // handleConfirmAction()
  // Sends PATCH request to backend to update referral status.
  // Includes proper error handling, loading state, and UI updates.
  // ---------------------------------------------------------------------------
  const handleConfirmAction = async () => {
    // ✅ Ensure selected action is valid
    if (!selectedAction || !["accepted", "declined", "more-info-requested"].includes(selectedAction)) {
      alert("Please select a valid action: Accept, Decline, or Request Info.");
      return;
    }

    setIsProcessing(true);
    try {
      // --- API call to update referral status ---
      const res = await fetch(`/api/referrals/${referral.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedAction, note: actionNotes }),
      });

      // --- Handle HTTP errors ---
      if (!res.ok) {
        let errorMessage = "Failed to update referral due to a server error.";
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = res.statusText;
        }
        throw new Error(errorMessage);
      }

      // --- Parse updated referral from API response ---
      const updatedReferral = await res.json();

      // --- Notify parent component of status update ---
      onStatusUpdate?.(referral.id, updatedReferral);

      // --- Close modals and open success dialog ---
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

  // ---------------------------------------------------------------------------
  // handleNotesSubmit()
  // Triggers confirmation step when user submits note in "Request Info" dialog.
  // ---------------------------------------------------------------------------
  const handleNotesSubmit = () => {
    if (actionNotes.trim()) {
      handleConfirmAction();
    }
  };

  // ---------------------------------------------------------------------------
  // resetState()
  // Resets all dialog and action states after closing or completing actions.
  // ---------------------------------------------------------------------------
  const resetState = () => {
    setSelectedAction(null);
    setActionNotes("");
    setShowConfirmDialog(false);
    setShowNotesDialog(false);
    setShowSuccessDialog(false);
  };

  // ---------------------------------------------------------------------------
  // getActionConfig(action)
  // Returns UI configuration (label, color, icon, description) for each action type.
  // ---------------------------------------------------------------------------
  const getActionConfig = (action) => {
    switch (action) {
      case "accepted":
        return {
          label: "Accept",
          icon: CheckCircle,
          variant: "default",
          className: "bg-teal-600 hover:bg-teal-700",
          description: "Accept this referral assigning to available support worker"
        };
      case "declined":
        return {
          label: "Decline",
          icon: XCircle,
          variant: "destructive",
          className: "",
          description: "Decline this referral with reason"
        };
      case "more-info-requested":
        return {
          label: "Request Info",
          icon: Info,
          variant: "outline",
          className: "border-blue-600 bg-blue-50 text-blue-600 hover:bg-blue-100",
          description: "Request additional information before processing"
        };
      default:
        return {
          label: action,
          icon: Clock,
          variant: "outline",
          className: "",
          description: ""
        };
    }
  };

  // ---------------------------------------------------------------------------
  // JSX: User Interface Section
  // Renders buttons and corresponding modals for confirmation, notes, and success.
  // ---------------------------------------------------------------------------
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

          {/* Footer buttons for confirmation or cancel */}
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
                  {React.createElement(getActionConfig(selectedAction)?.icon, { 
                    className: "h-4 w-4 mr-2" 
                  })}
                  Confirm {getActionConfig(selectedAction)?.label}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------ Notes Dialog (Request Info) ------------------------ */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Additional Information</DialogTitle>
            <DialogDescription>
              Please specify what additional information is needed for{" "}
              <strong>{referral.client_first_name} {referral.client_last_name}</strong>'s referral.
            </DialogDescription>
          </DialogHeader>

          {/* Textarea input for the note */}
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

          {/* Footer buttons for submitting note or cancel */}
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

          {/* Display referral result badge */}
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

          {/* Footer Close button */}
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

// Export the component for use in parent pages (e.g., admin dashboard)
export default ReferralActions;
