import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { User, Phone, Mail, MapPin, AlertTriangle, FileText, Info, Calendar, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Helper component for displaying a piece of information with an icon
const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 py-2">
    <div className="mt-1 text-muted-foreground">{icon}</div>
    <div className="flex-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-foreground mt-0.5">{value || "N/A"}</p>
    </div>
  </div>
);

export default function ViewProfileModal({ open, onOpenChange, client }) {
  if (!client) return null;

  // Debug: Log the client object to see actual structure
  console.log("ViewProfileModal - Client data:", client);
  console.log("ViewProfileModal - Client keys:", Object.keys(client));

  // Map all possible field names for client data
  const firstName = client.firstName || client.client_first_name || client.first_name || "";
  const lastName = client.lastName || client.client_last_name || client.last_name || "";
  const age = client.age || "";
  const email = client.email || "";
  const phone = client.phone || client.phoneNumber || "";
  const address = client.address || "";
  const dateOfBirth = client.dateOfBirth || client.date_of_birth || "";
  const gender = client.gender || "";
  const pronouns = client.pronouns || "";
  const primaryLanguage = client.primaryLanguage || client.primary_language || "";
  const riskLevel = client.riskLevel || client.risk_level || "Low";
  const status = client.status || "Active";
  const mentalHealthConcerns = client.mentalHealthConcerns || client.mental_health_concerns || "";
  const supportNeeded = client.supportNeeded || client.support_needed || "";
  const ethnoculturalBackground = client.ethnoculturalBackground || client.ethnocultural_background || "";
  
  // Emergency contact - map all possible field names
  const emergencyName = client.emergencyContactName || 
                       client.emergency_contact_name || 
                       (client.emergency_first_name && client.emergency_last_name 
                         ? `${client.emergency_first_name} ${client.emergency_last_name}` 
                         : "");
  const emergencyPhone = client.emergencyContactPhone || 
                        client.emergency_contact_phone || 
                        client.emergency_phone || "";
  const emergencyRelationship = client.emergencyContactRelationship || 
                               client.emergency_contact_relationship || 
                               client.relationship || "";
  
  // Referral details (if available)
  const referralSource = client.referralSource || client.referral_source || "";
  const reasonForReferral = client.reasonForReferral || client.reason_for_referral || "";
  const additionalNotes = client.additionalNotes || client.additional_notes || "";

  console.log("ViewProfileModal - Mapped values:", {
    firstName, lastName, age, email, phone, address, dateOfBirth, gender, pronouns,
    primaryLanguage, riskLevel, status, mentalHealthConcerns, supportNeeded,
    ethnoculturalBackground, emergencyName, emergencyPhone, emergencyRelationship
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card text-card-foreground border-border" showCloseButton={false}>
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold capitalize text-foreground">
                {firstName} {lastName}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-1">
                Client Profile Information
              </DialogDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={
                  riskLevel.toLowerCase() === "high" || riskLevel.toLowerCase() === "critical"
                    ? "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700"
                    : riskLevel.toLowerCase() === "medium"
                    ? "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700"
                    : "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700"
                }
              >
                {riskLevel} Risk
              </Badge>
              <Badge
                variant="outline"
                className={
                  status.toLowerCase() === "active"
                    ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700"
                    : "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700/30 dark:text-gray-300 dark:border-gray-600"
                }
              >
                {status}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
          {/* Left Column - Personal Information */}
          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-foreground border-b border-border pb-2 mb-3">
              Personal Information
            </h3>
            <InfoRow icon={<User size={18} />} label="Name" value={`${firstName} ${lastName}`} />
            {email && <InfoRow icon={<Mail size={18} />} label="Email" value={email} />}
            {phone && <InfoRow icon={<Phone size={18} />} label="Phone" value={phone} />}
            {address && <InfoRow icon={<MapPin size={18} />} label="Address" value={address} />}
            {age && <InfoRow icon={<Calendar size={18} />} label="Age" value={age} />}
            {dateOfBirth && <InfoRow icon={<Calendar size={18} />} label="Date of Birth" value={dateOfBirth} />}
            {gender && <InfoRow icon={<User size={18} />} label="Gender" value={gender} />}
            {pronouns && <InfoRow icon={<User size={18} />} label="Pronouns" value={pronouns} />}
            {primaryLanguage && <InfoRow icon={<Users size={18} />} label="Primary Language" value={primaryLanguage} />}
            {ethnoculturalBackground && (
              <InfoRow icon={<Users size={18} />} label="Ethnocultural Background" value={ethnoculturalBackground} />
            )}
          </div>

          {/* Right Column - Emergency Contact & Additional Info */}
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="font-semibold text-lg text-foreground border-b border-border pb-2 mb-3">
                Emergency Contact
              </h3>
              {emergencyName && <InfoRow icon={<User size={18} />} label="Name" value={emergencyName} />}
              {emergencyPhone && <InfoRow icon={<Phone size={18} />} label="Phone" value={emergencyPhone} />}
              {emergencyRelationship && (
                <InfoRow icon={<Users size={18} />} label="Relationship" value={emergencyRelationship} />
              )}
              {!emergencyName && !emergencyPhone && !emergencyRelationship && (
                <p className="text-sm text-muted-foreground">No emergency contact information available</p>
              )}
            </div>

            {referralSource && (
              <div className="space-y-1">
                <h3 className="font-semibold text-lg text-foreground border-b border-border pb-2 mb-3">
                  Referral Information
                </h3>
                <InfoRow icon={<FileText size={18} />} label="Referral Source" value={referralSource} />
                {reasonForReferral && (
                  <InfoRow icon={<FileText size={18} />} label="Reason for Referral" value={reasonForReferral} />
                )}
              </div>
            )}

            {(mentalHealthConcerns || supportNeeded || additionalNotes) && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg text-foreground border-b border-border pb-2 mb-3">
                  Additional Information
                </h3>
                {mentalHealthConcerns && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Mental Health Concerns
                    </p>
                    <p className="text-sm text-foreground leading-relaxed bg-muted/50 p-3 rounded-md">
                      {mentalHealthConcerns}
                    </p>
                  </div>
                )}
                {supportNeeded && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Support Needed
                    </p>
                    <p className="text-sm text-foreground leading-relaxed bg-muted/50 p-3 rounded-md">
                      {supportNeeded}
                    </p>
                  </div>
                )}
                {additionalNotes && !mentalHealthConcerns && !supportNeeded && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Notes
                    </p>
                    <p className="text-sm text-foreground leading-relaxed bg-muted/50 p-3 rounded-md">
                      {additionalNotes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t border-border pt-4">
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
