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
        if (!selectedUserId) {
            alert("Please select a team member to assign the referral to.");
            return;
        }
        onAssign(selectedUserId);
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold text-foreground">Accept and Assign Referral</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Accept the referral for <span className="font-medium text-foreground">{referral.client_first_name} {referral.client_last_name}</span> and assign it to a team member.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-3">
                        <label htmlFor="assignee" className="block text-sm font-medium text-foreground">
                            Assign to
                        </label>
                        <select 
                            id="assignee" 
                            value={selectedUserId} 
                            onChange={(e) => setSelectedUserId(e.target.value)} 
                            className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                            required
                        >
                            <option value="">Select a team member...</option>
                            {assignableUsers.map(user => (
                                <option key={user.id || user._id} value={user.id || user._id}>
                                    {user.first_name} {user.last_name} ({user.role_name === 'support_worker' ? 'Support Worker' : 'Team Leader'})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-3 justify-end pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-800"
                            disabled={!selectedUserId}
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Accept and Assign
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

const RequestInfoDialog = ({ referral, onClose, onSendMessage, onSendEmail }) => {
    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold text-foreground">Request More Information</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Send an email to request additional details about this referral.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-6">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900">
                            <Mail className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-foreground">
                                {referral.client_first_name} {referral.client_last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                An email will be sent to the referral source requesting more information.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 justify-end">
                    <Button onClick={onClose} variant="outline">
                        Cancel
                    </Button>
                    <Button onClick={onSendEmail} className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-800">
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email
                    </Button>
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
const ReferralActions = ({ referral, onStatusUpdate, userRole = "team-leader", assignableUsers = [], onStartChat }) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showRequestInfoDialog, setShowRequestInfoDialog] = useState(false);
  const [showEmailComposer, setShowEmailComposer] = useState(false);

  const [selectedAction, setSelectedAction] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!referral || !['pending', 'in-review', 'info-requested'].includes(referral.status.toLowerCase())) {
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
      // userId is actually the _id from assignableUsers
      // We need to find the clerkId from assignableUsers
      const selectedUser = assignableUsers.find(u => (u.id || u._id) === userId);
      const clerkId = selectedUser?.clerkId;

      if (!clerkId) {
        throw new Error("Could not find clerk ID for selected user");
      }

      const body = {
        status: "accepted",
        processed_by_user_id: clerkId, // Send Clerk ID, not _id
        processed_date: new Date().toISOString(),
      };

      console.log("Accepting referral with body:", body);

      const res = await fetch(`/api/referrals/${referral._id}`, {
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
      onStatusUpdate?.(referral._id, updatedReferral);

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

      const res = await fetch(`/api/referrals/${referral._id}`, {
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
      onStatusUpdate?.(referral._id, updatedReferral);

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

    const res = await fetch(`/api/referrals/${referral._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to update referral status");
    }

    const updatedReferral = await res.json();
    onStatusUpdate?.(referral._id, updatedReferral);

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
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-foreground">
              Confirm Decline Referral
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to decline the referral for{" "}
              <span className="font-medium text-foreground">{referral.client_first_name} {referral.client_last_name}</span>?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Declining this referral will mark it as rejected and remove it from your pending queue.
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            <Button variant="outline" onClick={resetState} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={isProcessing}
              variant="destructive"
            >
              {isProcessing ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Confirm Decline
                </>
              )}
            </Button>
          </div>
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
