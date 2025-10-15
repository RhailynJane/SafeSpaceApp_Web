import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { User, Phone, Mail, MapPin, AlertTriangle, FileText, Info } from "lucide-react";

// Helper component for displaying a piece of information with an icon
const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="mt-1">{icon}</div>
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-gray-800">{value || "N/A"}</p>
    </div>
  </div>
);

export default function ViewProfileModal({ open, onOpenChange, client: referral }) {
  if (!referral) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-bold capitalize">
            {referral.client_first_name} {referral.client_last_name}
          </DialogTitle>
          <DialogDescription>
            Referral from: {referral.referral_source}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 pb-6">
          {/* Left Column */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700 border-b pb-2">Client Information</h3>
            <InfoRow icon={<User size={16} />} label="Name" value={`${referral.client_first_name} ${referral.client_last_name}`} />
            <InfoRow icon={<Info size={16} />} label="Age" value={referral.age} />
            <InfoRow icon={<Mail size={16} />} label="Email" value={referral.email} />
            <InfoRow icon={<Phone size={16} />} label="Phone" value={referral.phone} />
            <InfoRow icon={<MapPin size={16} />} label="Address" value={referral.address} />
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700 border-b pb-2">Emergency Contact</h3>
            <InfoRow icon={<User size={16} />} label="Name" value={`${referral.emergency_first_name} ${referral.emergency_last_name}`} />
            <InfoRow icon={<Phone size={16} />} label="Phone" value={referral.emergency_phone} />

            <h3 className="font-semibold text-gray-700 border-b pb-2 pt-4">Referral Details</h3>
            <InfoRow icon={<FileText size={16} />} label="Reason for Referral" value={referral.reason_for_referral} />
            {referral.additional_notes && (
              <InfoRow icon={<Info size={16} />} label="Additional Notes" value={referral.additional_notes} />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
