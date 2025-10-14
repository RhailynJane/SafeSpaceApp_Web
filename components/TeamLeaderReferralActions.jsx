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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Clock } from "lucide-react";

const ApproveAndAssignModal = ({ referral, onClose, onConfirm, supportWorkers }) => {
    const [selectedSupportWorker, setSelectedSupportWorker] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(selectedSupportWorker);
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Approve and Assign Referral</DialogTitle>
                    <DialogDescription>
                        Approve the referral for {referral.client_first_name} {referral.client_last_name} and assign it to a Support Worker.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="assignSupportWorker" className="block text-sm font-medium text-gray-700">Assign to Support Worker</label>
                        <Select onValueChange={setSelectedSupportWorker} value={selectedSupportWorker}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Support Worker..." />
                            </SelectTrigger>
                            <SelectContent>
                                {supportWorkers.map(worker => (
                                <SelectItem key={worker.id} value={worker.id.toString()}>{worker.email}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit">Approve and Assign</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

const TeamLeaderReferralActions = ({ referral, onStatusUpdate, supportWorkers }) => {
  const [modal, setModal] = useState({ type: null, data: null });
  const [isProcessing, setIsProcessing] = useState(false);

  if (referral.status !== "in-review") {
    return null;
  }

  const openModal = (type, referral) => setModal({ type, data: referral });
  const closeModal = () => setModal({ type: null, data: null });

  const handleApproveAndAssign = async (supportWorkerId) => {
    if (!supportWorkerId) {
      alert("Please select a Support Worker.");
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/referrals/${referral.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: 'assigned',
          processed_by_user_id: parseInt(supportWorkerId, 10),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update referral');
      }

      const { referral: updatedReferral } = await res.json();

      // Create a notification for the support worker
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: parseInt(supportWorkerId, 10),
          message: `You have a new referral: ${referral.client_first_name} ${referral.client_last_name}`,
        }),
      });

      onStatusUpdate?.(referral.id, updatedReferral);
      closeModal();    } catch (error) {
      console.error("Error updating referral:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/referrals/${referral.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: 'declined' }),
      });

      if (!res.ok) {
        throw new Error('Failed to update referral');
      }

      const { referral: updatedReferral } = await res.json();
      onStatusUpdate?.(referral.id, updatedReferral);
      closeModal();
    } catch (error) {
      console.error("Error updating referral:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="flex gap-2 pt-4 border-t">
        <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={() => openModal('approve', referral)} disabled={isProcessing}>
          <CheckCircle className="h-4 w-4 mr-1" />
          Approve & Assign
        </Button>
        <Button size="sm" variant="destructive" onClick={() => openModal('decline', referral)} disabled={isProcessing}>
          <XCircle className="h-4 w-4 mr-1" />
          Decline
        </Button>
      </div>

      {modal.type === 'approve' && 
        <ApproveAndAssignModal 
            referral={modal.data} 
            onClose={closeModal} 
            onConfirm={handleApproveAndAssign} 
            supportWorkers={supportWorkers} 
        />}

      {modal.type === 'decline' && 
        <Dialog open={true} onOpenChange={closeModal}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Decline</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to decline the referral for <strong>{referral.client_first_name} {referral.client_last_name}</strong>?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={closeModal}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDecline}>Confirm Decline</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>}
    </>
  );
};

export default TeamLeaderReferralActions;
