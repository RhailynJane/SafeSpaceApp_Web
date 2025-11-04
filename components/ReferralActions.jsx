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
import { CheckCircle, XCircle, Info, MessageCircle, Clock, Mail } from "lucide-react";
import EmailComposerModal from "./EmailComposerModal";

const AcceptAndAssignModal = ({ referral, onClose, onAssign, assignableUsers }) => {
    const [selectedUserId, setSelectedUserId] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onAssign(selectedUserId);
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-3xl text-teal-900">Accept and Assign Referral</DialogTitle>
                    <DialogDescription>
                        Accept the referral for {referral.client_first_name} {referral.client_last_name} and assign it to a team member.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="assignee" className="block text-sm font-medium text-gray-700">Assign to</label>
                        <select id="assignee" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="mt-1 block w-full p-3 border border-gray-300 rounded-lg bg-white">
                            <option value="">Select a team member...</option>
                            {assignableUsers.map(user => (
                                <option key={user.id} value={user.id}>{user.first_name} {user.last_name} ({user.roles.role_name})</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" className="bg-teal-800 hover:bg-teal-900">Accept and Assign</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

const RequestInfoDialog = ({ referral, onClose, onSendMessage, onSendEmail }) => {
    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-3xl text-teal-900">Request More Information</DialogTitle>
                    <DialogDescription>
                        How would you like to contact the source of the referral for {referral.client_first_name} {referral.client_last_name}?
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p>Please select your preferred method to request more information.</p>
                    <div className="grid grid-cols-2 gap-4">
                        <Button onClick={onSendMessage} className="bg-teal-800 hover:bg-teal-900">
                            <MessageCircle className="h-4 w-4 mr-2 bg-text" />
                            Send In-App Message
                        </Button>
                        <Button onClick={onSendEmail} variant="outline">
                            <Mail className="h-4 w-4 mr-2" />
                            Send Email
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// -----------------------------------------------------------------------------
// Component: ReferralActions
// Props:
//   - referral: referral record object containing client + status info
//   - onStatusUpdate: callback to update parent state when referral status changes
//   - userRole: identifies the actor (default: "team-leader")
// -----------------------------------------------------------------------------
const ReferralActions = ({ referral, onStatusUpdate, userRole = "team-leader", assignableUsers = [] }) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showRequestInfoDialog, setShowRequestInfoDialog] = useState(false);
  const [showEmailComposer, setShowEmailComposer] = useState(false);

  const [selectedAction, setSelectedAction] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!referral || !['pending', 'in-review'].includes(referral.status.toLowerCase())) {
    return null;
  }

  // ------------------------ Action Click ------------------------
  const handleActionClick = (action) => {
    setSelectedAction(action);
    if (action === "info-requested") {
      setShowRequestInfoDialog(true);
    } else if (action === "accepted") {
      setShowAssignDialog(true);
    } else {
      setShowConfirmDialog(true);
    }
  };

  // ------------------------ Assign Action ------------------------
  const handleAssignAction = async (userId) => {
    if (!userId) {
      alert("Please select a user to assign the referral to.");
      return;
    }

    setIsProcessing(true);
    try {
      const body = {
        status: "accepted",
        processed_by_user_id: parseInt(userId, 10),
        processed_date: new Date().toISOString(),
      };

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

      setShowAssignDialog(false);
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error assigning referral:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ------------------------ Confirm Action ------------------------
  const handleConfirmAction = async () => {
    if (!selectedAction || !["declined"].includes(selectedAction)) {
      alert("Please select a valid action: Decline.");
      return;
    }

    setIsProcessing(true);
    try {
      const body = { status: selectedAction };

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
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error updating referral:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async() => {
    setShowRequestInfoDialog(false);
    setShowEmailComposer(true);

    try {
    const body = { 
      status: selectedAction};

    const res = await fetch(`/api/referrals/${referral.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to update referral status");
    }

    const updatedReferral = await res.json();
    onStatusUpdate?.(referral.id, updatedReferral);

    // Then open email composer
    setShowEmailComposer(true);
  } catch (error) {
    console.error("Error updating referral:", error);
    alert(`Error: ${error.message}`);
  } finally {
    setIsProcessing(false);
  }
  };

  const handleSendEmail = () => {
    const subject = `Request for more information regarding referral: ${referral.client_first_name} ${referral.client_last_name}`;
    const body = `Dear referrer,\n\nWe require more information regarding the referral for ${referral.client_first_name} ${referral.client_last_name}.\n\nPlease provide the following information:\n[Specify what information you need here]\n\nThank you,\nSafe Space Team`;
    window.location.href = `mailto:${referral.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    resetState();
  };

  // ------------------------ Reset ------------------------
  const resetState = () => {
    setSelectedAction(null);
    setShowConfirmDialog(false);
    setShowSuccessDialog(false);
    setShowAssignDialog(false);
    setShowRequestInfoDialog(false);
    setShowEmailComposer(false);
  };

  // ------------------------ Action Config ------------------------
  const getActionConfig = (action) => {
    switch (action) {
      case "accepted":
        return {
          label: "Accept & Assign",
          icon: CheckCircle,
          variant: "default",
          className: "bg-teal-600 hover:bg-teal-700",
          description: "Accept this referral and assign to a team member",
        };
      case "declined":
        return {
          label: "Decline",
          icon: XCircle,
          variant: "destructive",
          className: "",
          description: "Decline this referral with reason",
        };
      case "info-requested":
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
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleActionClick("info-requested")}
          className="border-blue-600 bg-blue-50 text-blue-600 hover:bg-blue-100"
        >
          <MessageCircle className="h-4 w-4 mr-1" />
          Request Info
        </Button>
        {["accepted", "declined"].map((action) => {
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

      {/* ------------------------ Assign Dialog ------------------------ */}
      {showAssignDialog && (
        <AcceptAndAssignModal 
            referral={referral} 
            onClose={resetState} 
            onAssign={handleAssignAction} 
            assignableUsers={assignableUsers} 
        />
      )}

      {/* ------------------------ Request Info Dialog ------------------------ */}
      {showRequestInfoDialog && (
        <RequestInfoDialog
          referral={referral}
          onClose={resetState}
          onSendMessage={handleSendMessage}
          onSendEmail={handleSendEmail}
        />
      )}

      {/* ------------------------ Email Composer Dialog ------------------------ */}
      {showEmailComposer && (
        <EmailComposerModal
          isOpen={showEmailComposer}
          onClose={resetState}
          referral={referral}
        />
      )}

      {/* ------------------------ Confirmation Dialog ------------------------ */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-3xl text-teal-800">
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
