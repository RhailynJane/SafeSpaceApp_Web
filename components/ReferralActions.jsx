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

const ReferralActions = ({ referral, onStatusUpdate, userRole = "team-leader" }) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [actionNotes, setActionNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Only show actions if referral is pending
  if (referral.status !== "Pending") {
    return null;
  }

  const handleActionClick = (action) => {
    setSelectedAction(action);
    if (action === "more-info-requested") {
      setShowNotesDialog(true);
    } else {
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmAction = async () => {
  // ✅ Prevent submission without a valid action
  if (!selectedAction || !["accepted", "declined", "more-info-requested"].includes(selectedAction)) {
    alert("Please select a valid action: Accept, Decline, or Request Info.");
    return;
  }

  setIsProcessing(true);
  try {
    const res = await fetch(`/api/referrals/${referral.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: selectedAction, note: actionNotes }),
    });

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


  const handleNotesSubmit = () => {
    if (actionNotes.trim()) {
      handleConfirmAction();
    }
  };

  const resetState = () => {
    setSelectedAction(null);
    setActionNotes("");
    setShowConfirmDialog(false);
    setShowNotesDialog(false);
    setShowSuccessDialog(false);
  };

  const getActionConfig = (action) => {
    switch (action) {
      case "accepted":
        return {
          label: "Accept",
          icon: CheckCircle,
          variant: "default",
          className: "bg-teal-600 hover:bg-teal-700",
          description: "accept this referral assigning to available support worker"
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

  return (
    <>
      {/* Action Buttons */}
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

      {/* Confirmation Dialog */}
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

      {/* Notes Dialog for More Info Requests */}
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

      {/* Success Dialog */}
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